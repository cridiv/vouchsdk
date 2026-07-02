import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service.js';
import { NombaService } from '../nomba/nomba.service.js';
import { FraudService } from '../fraud/fraud.service.js';
import { DeveloperService } from '../developer/developer.service.js';
import { DeveloperLogService } from '../common/services/developer-log.service.js';
import { CreateAgreementDto } from './dto/create-agreement.dto.js';
import { ConfirmMilestoneDto } from './dto/confirm-milestone.dto.js';
import { AssessPaymentRiskDto } from './dto/assess-payment-risk.dto.js';
import { Developer, EscrowStatus } from '@prisma/client';
import { EscrowState } from './state/escrow.state.js';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nombaService: NombaService,
    private readonly fraudService: FraudService,
    private readonly developerService: DeveloperService,
    private readonly developerLogService: DeveloperLogService,
    private readonly stateMachine: EscrowState,
  ) {}

  async createAgreement(dto: CreateAgreementDto, developer: Developer) {
    this.logger.log(`Creating escrow agreement for developer: ${developer.id}`);

    // Thing 1 — Resolve Both Users
    const buyer = await this.developerService.resolveOrCreatePlatformUser(dto.buyerExternalId, developer.id);
    const seller = await this.developerService.resolveOrCreatePlatformUser(dto.sellerExternalId, developer.id);

    const milestonesTotal = dto.milestones.reduce((sum, m) => sum + m.amount, 0);
    if (milestonesTotal !== dto.totalAmount) {
      throw new BadRequestException(
        `Milestone amounts (${milestonesTotal}) must equal totalAmount (${dto.totalAmount})`
      );
    }

    // Thing 2 — Validate Both Are Identity Verified
    if (!buyer.identityVerified) {
      throw new BadRequestException('Buyer identity not verified');
    }
    if (!seller.identityVerified) {
      throw new BadRequestException('Seller identity not verified');
    }

    // Thing 3 — Create the Agreement and Milestones in DB (Atomically)
    const agreement = await this.prisma.agreement.create({
      data: {
        developerId: developer.id,
        buyerExternalId: dto.buyerExternalId,
        sellerExternalId: dto.sellerExternalId,
        totalAmount: dto.totalAmount,
        status: 'PENDING',
        milestones: {
          create: dto.milestones.map((m) => ({
            title: m.title,
            amount: m.amount,
            status: 'PENDING',
          })),
        },
      },
      include: {
        milestones: true,
      },
    });

    // Thing 4 — Create the Nomba Virtual Account
    const buyerName = dto.buyerName ?? `Vouch-${dto.buyerExternalId.substring(0, 8)}`;

    let virtualAccount: any;
    try {
      virtualAccount = await this.nombaService.createVirtualAccount({
        accountName: buyerName,
        agreementId: agreement.id,
      });
    } catch (err: any) {
      this.logger.error(`Failed to create Nomba virtual account for agreement ${agreement.id}:`, err.message);
      // Clean up the created agreement & milestones so we don't leave orphaned pending records
      await this.prisma.milestone.deleteMany({ where: { agreementId: agreement.id } });
      await this.prisma.agreement.delete({ where: { id: agreement.id } });
      throw new BadRequestException(`Nomba virtual account creation failed: ${err.message}`);
    }

    // Nomba returns data nested under response.data
    const vaData = virtualAccount?.data ?? virtualAccount;

    // Update the Agreement with virtual account details
    const updatedAgreement = await this.prisma.agreement.update({
      where: { id: agreement.id },
      data: {
        nombaVirtualAccountId: vaData?.accountHolderId ?? agreement.id,
        nombaVirtualAccountNo: vaData?.bankAccountNumber,
        nombaVirtualAccountRef: vaData?.accountRef,
      },
      include: {
        milestones: true,
      },
    });

    // Thing 5 — Log the Event
    void this.developerLogService.log({
      developerId: developer.id,
      eventType: 'ESCROW_CREATED',
      externalUserId: dto.buyerExternalId,
      agreementId: updatedAgreement.id,
      payload: {
        agreement: updatedAgreement,
        virtualAccount: vaData,
      },
    });

    return {
      agreementId: updatedAgreement.id,
      status: updatedAgreement.status,
      totalAmount: updatedAgreement.totalAmount,
      currency: updatedAgreement.currency,
      nombaVirtualAccountNo: updatedAgreement.nombaVirtualAccountNo,
      nombaBank: vaData?.bankName ?? 'Nomba MFB',
      buyerExternalId: updatedAgreement.buyerExternalId,
      sellerExternalId: updatedAgreement.sellerExternalId,
      createdAt: updatedAgreement.createdAt,
      milestones: updatedAgreement.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        amount: m.amount,
        status: m.status,
        buyerConfirmed: m.buyerConfirmed,
        sellerConfirmed: m.sellerConfirmed,
      })),
    };
  }

  @OnEvent('payment.confirmed')
  async handlePaymentConfirmed(payload: {
    agreementId: string;
    transactionRef: string;
  }) {
    this.logger.log(
      `payment.confirmed received for agreement ${payload.agreementId}, ref ${payload.transactionRef}`
    );

    try {
      // Step 1 — Fetch current agreement and validate state
      const agreement = await this.prisma.agreement.findUnique({
        where: { id: payload.agreementId }
      });

      if (!agreement) {
        this.logger.warn(`Agreement ${payload.agreementId} not found. Ignoring payment event.`);
        return;
      }

      // Step 2 — Nomba payments are verified via webhook reconciliation (no separate verify call)
      // This event is emitted by the NombaWebhookController after reconciliation passes

      if (agreement.status !== 'PENDING') {
        this.logger.warn(
          `Agreement ${payload.agreementId} is already ${agreement.status}. Ignoring duplicate event.`
        );
        return;
      }

      // Step 3 — Transition state machine
      this.stateMachine.transition(agreement.status as EscrowStatus, EscrowStatus.FUNDED);

      // Step 4 — Update agreement in DB
      await this.prisma.agreement.update({
        where: { id: payload.agreementId },
        data: { status: 'FUNDED' }
      });

      this.logger.log(`Agreement ${payload.agreementId} successfully moved to FUNDED`);

      // Step 5 — Log the event
      void this.developerLogService.log({
        developerId: agreement.developerId,
        eventType: 'ESCROW_FUNDED',
        agreementId: payload.agreementId,
        payload: {
          transactionRef: payload.transactionRef,
          amount: agreement.totalAmount,
          status: 'SUCCESS',
        }
      });

    } catch (error: any) {
      this.logger.error(
        `Failed to handle payment.confirmed for agreement ${payload.agreementId}:`,
        error.message
      );

      // Attempt to log the exception if we have an agreement context
      try {
        const agreement = await this.prisma.agreement.findUnique({
          where: { id: payload.agreementId }
        });
        if (agreement) {
          void this.developerLogService.log({
            developerId: agreement.developerId,
            eventType: 'ESCROW_FUND_FAILED',
            agreementId: payload.agreementId,
            payload: {
              transactionRef: payload.transactionRef,
              reason: error.message || 'Unknown processing error',
            }
          });
        }
      } catch (logErr: any) {
        this.logger.error('Failed to log payment.confirmed failure to DeveloperLog:', logErr.message);
      }
    }
  }

  async confirmMilestone(
    agreementId: string,
    milestoneId: string,
    dto: ConfirmMilestoneDto,
    developer: Developer,
  ) {
    this.logger.log(`Confirming milestone ${milestoneId} on agreement ${agreementId} for user ${dto.externalUserId}`);

    // Step 1 — Resolve platform user
    const user = await this.developerService.resolveOrCreatePlatformUser(
      dto.externalUserId,
      developer.id,
    );

    // Step 2 — Fetch agreement and verify the caller is a participant
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { milestones: true },
    });

    if (!agreement) {
      throw new NotFoundException(`Agreement with ID ${agreementId} not found`);
    }

    const isBuyer = agreement.buyerExternalId === dto.externalUserId;
    const isSeller = agreement.sellerExternalId === dto.externalUserId;

    if (!isBuyer && !isSeller) {
      throw new ForbiddenException(`User ${dto.externalUserId} is not a participant in this agreement`);
    }

    // Step 3 — Locate the milestone, apply confirmation flags, and save to DB
    const milestone = agreement.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${milestoneId} not found on this agreement`);
    }

    if (milestone.status === 'DISBURSED') {
      throw new BadRequestException(`Milestone with ID ${milestoneId} is already DISBURSED`);
    }

    let updatedBuyerConfirmed = milestone.buyerConfirmed;
    let updatedSellerConfirmed = milestone.sellerConfirmed;

    if (isBuyer) {
      updatedBuyerConfirmed = true;
    }
    if (isSeller) {
      updatedSellerConfirmed = true;
    }

    const updatedMilestone = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        buyerConfirmed: updatedBuyerConfirmed,
        sellerConfirmed: updatedSellerConfirmed,
      },
    });

    const bothConfirmed = updatedMilestone.buyerConfirmed && updatedMilestone.sellerConfirmed;

    // Step 4 — Check if only one party confirmed
    if (!bothConfirmed) {
      void this.developerLogService.log({
        developerId: agreement.developerId,
        eventType: 'MILESTONE_CONFIRMED',
        agreementId: agreement.id,
        payload: {
          milestoneId,
          title: milestone.title,
          amount: milestone.amount,
          confirmedBy: isBuyer ? 'BUYER' : 'SELLER',
          buyerConfirmed: updatedMilestone.buyerConfirmed,
          sellerConfirmed: updatedMilestone.sellerConfirmed,
        }
      });

      return {
        message: 'Milestone confirmation recorded. Waiting for the other party.',
        milestone: updatedMilestone,
      };
    }

    // Both parties have confirmed! Proceed to fraud checking and disbursement in the next steps.
    const sellerUser = await this.developerService.resolveOrCreatePlatformUser(
      agreement.sellerExternalId,
      developer.id,
    );

    // Step 5 — Final Fraud Check on the Seller Side
    const fraudResult = await this.fraudService.assess({
      developerId: developer.id,
      transactionId: milestoneId,
      platformUserId: sellerUser.id,
      ipAddress: dto.ipAddress || '127.0.0.1',
      deviceFingerprint: dto.deviceFingerprint || 'fallback-device-fingerprint',
      transactionAmount: milestone.amount,
      agreementId: agreement.id,
    });

    if (fraudResult.flag === 'RED') {
      await this.freezeAgreement(
        agreement.id,
        developer.id,
        `Seller failed milestone confirmation fraud check with score ${fraudResult.score}`,
      );

      return {
        message: 'Milestone confirmation blocked due to high fraud risk. Escrow has been frozen.',
        agreementStatus: 'FROZEN',
        milestone: updatedMilestone,
        fraudResult,
      };
    }

    // Step 6 — Validate Seller Bank details are provided for disbursement
    if (!dto.sellerAccountNumber || !dto.sellerBankCode) {
      throw new BadRequestException(
        'Seller bank details (sellerAccountNumber and sellerBankCode) are required to execute milestone disbursement.',
      );
    }

    let nombaTransactionId = '';
    const disbursementRef = `DISB-${milestoneId.substring(0, 8)}-${Date.now()}`;

    try {
      // Step 7 — Disburse to the Seller via Nomba
      const disbursement = await this.nombaService.disburse({
        accountNumber: dto.sellerAccountNumber,
        bankCode: dto.sellerBankCode,
        amount: milestone.amount,
        narration: milestone.title,
        reference: disbursementRef,
      });
      nombaTransactionId = disbursement?.data?.transactionReference ?? disbursementRef;

    } catch (error: any) {
      // Step 7.1 — Log Disbursement Failure
      void this.developerLogService.log({
        developerId: developer.id,
        eventType: 'DISBURSEMENT_FAILED',
        agreementId: agreement.id,
        payload: {
          milestoneId,
          amount: milestone.amount,
          reason: error.message || 'Nomba API error during disbursement',
        },
      });

      throw new BadRequestException(`Nomba disbursement failed: ${error.message}`);
    }

    // Step 8 — Update the Milestone Record
    const finalMilestone = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'DISBURSED',
        nombaTransactionId,
        disbursedAt: new Date(),
      },
    });

    // Step 10 — Check if All Milestones Are Done
    const allMilestones = await this.prisma.milestone.findMany({
      where: { agreementId },
    });

    const allDisbursed = allMilestones.every((m) => m.status === 'DISBURSED');
    let finalAgreementStatus: EscrowStatus = agreement.status as EscrowStatus;

    if (allDisbursed) {
      finalAgreementStatus = 'DISBURSED';
      this.stateMachine.transition(agreement.status as EscrowStatus, EscrowStatus.DISBURSED);

      await this.prisma.agreement.update({
        where: { id: agreement.id },
        data: { status: 'DISBURSED' },
      });
    } else {
      if (agreement.status === 'FUNDED') {
        finalAgreementStatus = 'IN_PROGRESS';
        this.stateMachine.transition(EscrowStatus.FUNDED, EscrowStatus.IN_PROGRESS);

        await this.prisma.agreement.update({
          where: { id: agreement.id },
          data: { status: 'IN_PROGRESS' },
        });
      }
    }

    // Step 11 — Log Events
    void this.developerLogService.log({
      developerId: developer.id,
      eventType: 'MILESTONE_CONFIRMED',
      agreementId: agreement.id,
      payload: {
        milestoneId,
        title: milestone.title,
        amount: milestone.amount,
        confirmedBy: isBuyer ? 'BUYER' : 'SELLER',
        buyerConfirmed: true,
        sellerConfirmed: true,
      },
    });

    void this.developerLogService.log({
      developerId: developer.id,
      eventType: 'DISBURSEMENT_COMPLETED',
      agreementId: agreement.id,
      payload: {
        milestoneId,
        title: milestone.title,
        amount: milestone.amount,
        sellerAccountNumber: dto.sellerAccountNumber,
        sellerBankCode: dto.sellerBankCode,
        nombaTransactionId,
        disbursementRef,
      },
    });

    return {
      message: allDisbursed
        ? 'Milestone confirmed and escrow fully settled!'
        : 'Milestone confirmed and disbursed!',
      milestone: finalMilestone,
      agreementStatus: finalAgreementStatus,
    };
  }

  async getAgreement(agreementId: string, developer: Developer) {
    this.logger.log(`Fetching agreement ${agreementId} for developer ${developer.id}`);

    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      include: {
        milestones: true,
        fraudAssessments: true,
        nombaTransfers: true,
      },
    });

    if (!agreement) {
      throw new NotFoundException(`Agreement with ID ${agreementId} not found`);
    }

    if (agreement.developerId !== developer.id) {
      throw new ForbiddenException(`You do not have permission to access this agreement`);
    }

    return agreement;
  }

  async getStatement(agreementId: string, developer: Developer) {
    this.logger.log(`Generating statement for agreement ${agreementId} for developer ${developer.id}`);

    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      include: {
        milestones: true,
        nombaTransfers: true,
      },
    });

    if (!agreement) {
      throw new NotFoundException(`Agreement with ID ${agreementId} not found`);
    }

    if (agreement.developerId !== developer.id) {
      throw new ForbiddenException(`You do not have permission to access this agreement`);
    }

    // Fetch related developer logs to extract audit info and refunds
    const logs = await this.prisma.developerLog.findMany({
      where: {
        agreementId,
        developerId: developer.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Extract refunds (both successful and failed flags) from logs
    const refunds = logs
      .filter((log) => log.eventType === 'OVERPAYMENT_FLAGGED' && log.payload && (log.payload as any).automaticRefund)
      .map((log) => {
        const refundInfo = (log.payload as any).automaticRefund;
        return {
          success: refundInfo.success,
          amount: refundInfo.refundAmount,
          reference: refundInfo.refundRef,
          reason: refundInfo.reason,
          timestamp: log.createdAt,
        };
      });

    const shortfall = Math.max(0, agreement.totalAmount - (agreement.amountReceived ?? 0));
    const overpayment = Math.max(0, (agreement.amountReceived ?? 0) - agreement.totalAmount);

    return {
      agreementId: agreement.id,
      status: agreement.status,
      totalExpected: agreement.totalAmount,
      amountReceived: agreement.amountReceived,
      shortfall,
      overpayment,
      currency: agreement.currency,
      createdAt: agreement.createdAt,
      transfers: agreement.nombaTransfers.map((t) => ({
        id: t.id,
        amount: t.amount,
        reference: t.nombaReference,
        senderName: t.senderName,
        senderBank: t.senderBank,
        timestamp: t.createdAt,
      })),
      milestones: agreement.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        amount: m.amount,
        status: m.status,
        nombaTransactionId: m.nombaTransactionId,
        disbursedAt: m.disbursedAt,
      })),
      refunds,
      auditLogs: logs.map((l) => ({
        timestamp: l.createdAt,
        eventType: l.eventType,
        payload: l.payload,
      })),
    };
  }

  /**
   * DEV/TEST ONLY: Simulate a Squad webhook payment confirmation.
   * Directly transitions the agreement from PENDING to FUNDED without calling Squad.
   */
  async simulatePayment(agreementId: string, transactionRef: string, developer: Developer) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
    });

    if (!agreement) {
      throw new NotFoundException(`Agreement with ID ${agreementId} not found`);
    }

    if (agreement.developerId !== developer.id) {
      throw new ForbiddenException(`You do not have permission to access this agreement`);
    }

    if (agreement.status !== 'PENDING') {
      throw new BadRequestException(`Agreement is already ${agreement.status}. Cannot simulate payment.`);
    }

    // Directly transition to FUNDED
    this.stateMachine.transition(agreement.status as EscrowStatus, EscrowStatus.FUNDED);

    await this.prisma.agreement.update({
      where: { id: agreementId },
      data: { status: 'FUNDED' },
    });

    this.logger.log(`[SIMULATE] Agreement ${agreementId} moved to FUNDED (ref: ${transactionRef})`);

    void this.developerLogService.log({
      developerId: developer.id,
      eventType: 'ESCROW_FUNDED',
      agreementId,
      payload: {
        transactionRef,
        simulated: true,
      },
    });

    return {
      status: 'FUNDED',
      agreementId,
      transactionRef,
      message: 'Payment simulated successfully. Agreement is now FUNDED.',
    };
  }

  async assessPaymentRisk(
    agreementId: string,
    dto: AssessPaymentRiskDto,
    developer: Developer,
  ) {
    this.logger.log(`Assessing payment risk for agreement ${agreementId} and user ${dto.externalUserId}`);

    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
    });

    if (!agreement) {
      throw new NotFoundException(`Agreement with ID ${agreementId} not found`);
    }

    if (agreement.developerId !== developer.id) {
      throw new ForbiddenException(`You do not have permission to access this agreement`);
    }

    const user = await this.developerService.resolveOrCreatePlatformUser(
      dto.externalUserId,
      developer.id,
    );

    const fraudResult = await this.fraudService.assess({
      developerId: developer.id,
      transactionId: `ASSESS-${agreementId.substring(0, 8)}-${Date.now()}`,
      platformUserId: user.id,
      ipAddress: dto.ipAddress || '127.0.0.1',
      deviceFingerprint: dto.deviceFingerprint || 'fallback-device-fingerprint',
      transactionAmount: agreement.totalAmount,
      agreementId: agreement.id,
      simulateVpn: dto.simulate_vpn,
      simulateImpossibleTravel: dto.simulate_impossible_travel,
    });

    if (fraudResult.flag === 'RED') {
      await this.freezeAgreement(
        agreement.id,
        developer.id,
        `Buyer failed risk assessment prior to payment with score ${fraudResult.score}`,
      );

      return {
        status: 'FROZEN',
        score: fraudResult.score,
        flag: fraudResult.flag,
        triggeredSignals: fraudResult.triggered_signals || [],
        message: 'Payment risk assessment flagged RED. Escrow is frozen and payments are blocked.',
      };
    }

    if (fraudResult.flag === 'AMBER') {
      return {
        status: agreement.status,
        score: fraudResult.score,
        flag: fraudResult.flag,
        triggeredSignals: fraudResult.triggered_signals || [],
        message: 'Elevated risk detected. Additional verification is required before payment can proceed.',
      };
    }

    return {
      status: agreement.status,
      score: fraudResult.score,
      flag: fraudResult.flag,
      triggeredSignals: fraudResult.triggered_signals || [],
      nombaVirtualAccountId: agreement.nombaVirtualAccountId,
      nombaVirtualAccountNo: agreement.nombaVirtualAccountNo,
      nombaBank: 'Nomba MFB',
      amount: agreement.totalAmount,
      message: 'Payment risk assessment cleared. You may proceed with funding.',
    };
  }

  private async freezeAgreement(agreementId: string, developerId: string, reason: string) {
    this.logger.warn(`FREEZING agreement ${agreementId} due to: ${reason}`);

    await this.prisma.agreement.update({
      where: { id: agreementId },
      data: { status: 'FROZEN' },
    });

    void this.developerLogService.log({
      developerId,
      eventType: 'ESCROW_FROZEN',
      agreementId,
      payload: {
        reason,
        frozenAt: new Date(),
      },
    });
  }
}

