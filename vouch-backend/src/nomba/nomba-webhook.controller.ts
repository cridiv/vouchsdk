import {
  Controller,
  Post,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NombaService } from './nomba.service.js';

/**
 * Nomba webhook handler — mounted at POST /escrow/webhooks/nomba
 *
 * Signature: HMAC-SHA256 over the raw request body,
 * delivered in the `nomba-signature` header.
 *
 * We acknowledge immediately (200) then reconcile asynchronously
 * to avoid Nomba retrying on slow DB operations.
 *
 * Idempotency: every event carries a `requestId`. We store it on
 * the NombaTransfer record (via `nombaReference`) which has a @unique
 * constraint — duplicate deliveries will simply throw a unique-constraint
 * error and be silently swallowed.
 */
@Controller('escrow/webhooks')
export class NombaWebhookController {
  private readonly logger = new Logger(NombaWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly nombaService: NombaService,
  ) {}

  @Post('nomba')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    // ── 1. Signature verification ──────────────────────────────────────
    const signature = req.headers['nomba-signature'] as string | undefined;

    if (!signature) {
      this.logger.warn('Nomba webhook received without signature — rejected');
      return res.status(401).json({ error: 'Missing nomba-signature header' });
    }

    // req.body is a Buffer when express.raw() middleware is applied
    const rawBody: Buffer = req.body;
    const expected = crypto
      .createHmac('sha256', process.env.NOMBA_WEBHOOK_SECRET ?? '')
      .update(rawBody)
      .digest('hex');

    if (signature !== expected) {
      this.logger.warn('Nomba webhook signature mismatch — rejected');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // ── 2. Parse payload ───────────────────────────────────────────────
    let event: Record<string, any>;
    try {
      event = JSON.parse(rawBody.toString());
    } catch {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    // ── 3. Acknowledge immediately ─────────────────────────────────────
    res.sendStatus(200);

    // ── 4. Reconcile asynchronously ────────────────────────────────────
    setImmediate(() => this.reconcile(event));
  }

  // ─────────────────────────────────────────────────────────────────────────
  private async reconcile(event: Record<string, any>) {
    const eventType: string = event.eventType ?? event.event ?? '';
    const requestId: string = event.requestId ?? event.id ?? '';

    this.logger.log(`Nomba webhook received — type: ${eventType}, requestId: ${requestId}`);

    // We only care about virtual account funded events
    if (eventType !== 'virtual_account.funded') {
      this.logger.log(`Ignoring event type: ${eventType}`);
      return;
    }

    try {
      const data = event.data ?? {};

      // The account number that was credited — we match this to an Agreement
      const creditedAccountNo: string = data.accountNumber ?? data.virtualAccountNumber ?? '';
      const amountKobo: number = data.amount ?? 0;
      const amountNaira = amountKobo / 100;

      if (!creditedAccountNo) {
        this.logger.error('No accountNumber in webhook payload — cannot reconcile', event);
        return;
      }

      // ── Find the Agreement that owns this virtual account ──────────────
      const agreement = await this.prisma.agreement.findFirst({
        where: { nombaVirtualAccountNo: creditedAccountNo },
      });

      if (!agreement) {
        this.logger.warn(
          `No agreement found for virtual account ${creditedAccountNo} — ignoring`,
        );
        return;
      }

      // ── Idempotency guard — unique constraint on nombaReference ────────
      // If this requestId was already stored, the create will throw and we bail.
      try {
        await this.prisma.nombaTransfer.create({
          data: {
            agreementId: agreement.id,
            nombaReference: requestId || `${creditedAccountNo}-${Date.now()}`,
            amount: amountNaira,
            senderName: data.senderName ?? data.originatorName ?? null,
            senderBank: data.senderBank ?? data.originatorBank ?? null,
            senderAccount: data.senderAccount ?? data.originatorAccount ?? null,
            rawWebhookPayload: event,
          },
        });
      } catch (err: any) {
        // P2002 = unique constraint violation → already processed this requestId
        if (err?.code === 'P2002') {
          this.logger.warn(`Duplicate webhook requestId ${requestId} — skipping`);
          return;
        }
        throw err; // unexpected error — rethrow to outer catch
      }

      // ── Update amountReceived and derive new EscrowStatus ──────────────
      const newAmountReceived = (agreement.amountReceived ?? 0) + amountNaira;
      const total = agreement.totalAmount;

      let newStatus = agreement.status;

      if (agreement.status === 'FROZEN' || agreement.status === 'DISBURSED') {
        // Don't touch frozen or completed escrows
        this.logger.warn(
          `Agreement ${agreement.id} is ${agreement.status} — recording transfer but not changing status`,
        );
      } else if (newAmountReceived >= total * 1.01) {
        // More than 1% over — flag as overfunded
        newStatus = 'OVERFUNDED';
      } else if (newAmountReceived >= total) {
        // Exact or within tolerance — fully funded
        newStatus = 'FUNDED';
      } else {
        // Partial payment received
        newStatus = 'PARTIAL';
      }

      // ── Handle Overpayment / Excess Refund ─────────────────────────────
      let refundRef: string | null = null;
      let refundSuccess = false;
      let refundReason: string | null = null;

      if (newStatus === 'OVERFUNDED') {
        const excess = newAmountReceived - total;
        const senderAccount = data.senderAccount ?? data.originatorAccount ?? '';
        let senderBank = data.senderBankCode ?? data.originatorBankCode ?? '';

        if (!senderBank) {
          const rawBankName = data.senderBank ?? data.originatorBank ?? '';
          if (rawBankName.toLowerCase().includes('wema')) {
            senderBank = '035';
          } else if (rawBankName.toLowerCase().includes('gtb')) {
            senderBank = '058';
          } else if (rawBankName.toLowerCase().includes('zenith')) {
            senderBank = '057';
          }
        }

        if (senderAccount && senderBank) {
          try {
            this.logger.log(
              `Overpayment detected on agreement ${agreement.id}. Triggering automatic refund of excess: ₦${excess} to Account: ${senderAccount}, Bank: ${senderBank}`,
            );
            const refundRes = await this.nombaService.disburse({
              accountNumber: senderAccount,
              bankCode: senderBank,
              amount: excess,
              narration: `Refund Excess for Vouch Agreement ${agreement.id.substring(0, 8)}`,
              reference: `RFND-${requestId.substring(0, 8)}-${Date.now()}`,
              accountName: data.senderName ?? 'Vouch Buyer Refund',
            });
            refundRef = refundRes?.data?.transactionReference ?? `RFND-${requestId.substring(0, 8)}`;
            refundSuccess = true;
            this.logger.log(`Automatic refund executed successfully. Ref: ${refundRef}`);
          } catch (err: any) {
            refundReason = err.message || 'Nomba API disbursement error';
            this.logger.error(`Automatic refund execution failed: ${refundReason}`);
          }
        } else {
          refundReason = 'Insufficient sender bank details for automatic refund';
          this.logger.warn(`Cannot trigger automatic refund: ${refundReason}`);
        }
      }

      await this.prisma.agreement.update({
        where: { id: agreement.id },
        data: {
          amountReceived: newAmountReceived,
          status: newStatus,
        },
      });

      this.logger.log(
        `Agreement ${agreement.id} → received ₦${amountNaira}, total ₦${newAmountReceived}/${total}, status: ${newStatus}`,
      );

      // ── Log the reconciliation event ───────────────────────────────────
      const logEvent =
        newStatus === 'OVERFUNDED'
          ? 'OVERPAYMENT_FLAGGED'
          : 'RECONCILIATION_MATCHED';

      await this.prisma.developerLog.create({
        data: {
          developerId: agreement.developerId,
          eventType: logEvent,
          agreementId: agreement.id,
          payload: {
            nombaReference: requestId,
            amountReceived: amountNaira,
            runningTotal: newAmountReceived,
            totalExpected: total,
            newStatus,
            senderName: data.senderName ?? null,
            automaticRefund: newStatus === 'OVERFUNDED' ? {
              triggered: true,
              success: refundSuccess,
              refundRef,
              reason: refundReason,
              refundAmount: newAmountReceived - total,
            } : undefined,
          },
        },
      });

      // ── Emit payment.confirmed so escrow service moves state machine ───
      if (newStatus === 'FUNDED' || newStatus === 'OVERFUNDED') {
        this.eventEmitter.emit('payment.confirmed', {
          agreementId: agreement.id,
          transactionRef: requestId,
        });
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to reconcile Nomba webhook for requestId ${requestId}`,
        err.message,
      );
    }
  }
}
