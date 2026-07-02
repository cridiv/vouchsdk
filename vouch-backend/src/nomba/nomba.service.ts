import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NombaService {
  private readonly logger = new Logger(NombaService.name);
  private readonly baseUrl = 'https://sandbox.nomba.com';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await axios.post(
      `${this.baseUrl}/v1/auth/token/issue`,
      {
        grant_type: 'client_credentials',
        client_id: process.env.NOMBA_CLIENT_ID,
        client_secret: process.env.NOMBA_CLIENT_SECRET,
      },
      {
        headers: {
          accountId: process.env.NOMBA_ACCOUNT_ID,
          'Content-Type': 'application/json',
        },
      },
    );

    const tokenData = response.data?.data ?? response.data;
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = Date.now() + tokenData.expires_in * 1000 - 60000;
    return this.accessToken!;
  }

  private async headers() {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accountId: process.env.NOMBA_ACCOUNT_ID,
    };
  }

  async createVirtualAccount(params: {
    accountName: string;
    agreementId: string;
    amount?: number;
  }) {
    try {
      const subAccountId = process.env.NOMBA_SUB_ACCOUNT_ID;
      const endpoint = subAccountId
        ? `${this.baseUrl}/v1/accounts/virtual/${subAccountId}`
        : `${this.baseUrl}/v1/accounts/virtual`;

      const response = await axios.post(
        endpoint,
        {
          accountRef: params.agreementId,           // unique ref — we use the agreementId
          accountName: params.accountName,
          expiryDate: null,                         // no expiry — stays open until funded
          ...(params.amount ? { amount: params.amount * 100 } : {}), // kobo; optional lock
        },
        { headers: await this.headers() },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Failed to create Nomba virtual account',
        error?.response?.data,
      );
      throw error;
    }
  }

  async disburse(params: {
    accountNumber: string;
    bankCode: string;
    amount: number;
    narration: string;
    reference: string;
    accountName?: string;
  }) {
    try {
      const subAccountId = process.env.NOMBA_SUB_ACCOUNT_ID;

      let response;
      if (subAccountId) {
        // v2 sub-account bank transfer
        response = await axios.post(
          `${this.baseUrl}/v2/transfers/bank/${subAccountId}`,
          {
            amount: params.amount,
            accountNumber: params.accountNumber,
            accountName: params.accountName ?? 'Vouch Seller Payout',
            bankCode: params.bankCode,
            merchantTxRef: params.reference,
            senderName: 'Vouch Escrow Payout',
            narration: params.narration,
          },
          { headers: await this.headers() },
        );
      } else {
        // v1 parent transfer
        response = await axios.post(
          `${this.baseUrl}/v1/transfers/single`,
          {
            amount: params.amount,
            narration: params.narration,
            beneficiaryAccount: params.accountNumber,
            beneficiaryBank: params.bankCode,
            reference: params.reference,
          },
          { headers: await this.headers() },
        );
      }

      return response.data;
    } catch (error: any) {
      this.logger.error('Nomba disburse failed', error?.response?.data);
      throw error;
    }
  }
}
