const axios = require('axios');
const crypto = require('crypto');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_KEY = 'vouch_e62a93d67ead621439fcb0569e920c8e6988c7b533dc2845';
const WEBHOOK_SECRET = 'NombaHackathon2026';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔷 ${title}`);
  console.log('='.repeat(80));
}

async function run() {
  try {
    const buyerId = 'buyer_platform_' + Math.random().toString(36).substring(2, 8);
    const sellerId = 'seller_platform_' + Math.random().toString(36).substring(2, 8);

    // ────────────────────────────────────────────────────────────────────────
    printSection('1. Identity Module — Marking Users as Verified (Test Bypass)');
    // ────────────────────────────────────────────────────────────────────────
    console.log(`Verifying buyer ID: ${buyerId}...`);
    const buyerVer = await axios.post(`${BASE_URL}/developer/mark-verified`, {
      externalUserId: buyerId
    }, { headers });
    console.log(`Buyer status: ${buyerVer.data.message}`);

    console.log(`Verifying seller ID: ${sellerId}...`);
    const sellerVer = await axios.post(`${BASE_URL}/developer/mark-verified`, {
      externalUserId: sellerId
    }, { headers });
    console.log(`Seller status: ${sellerVer.data.message}`);

    // ────────────────────────────────────────────────────────────────────────
    printSection('2. Escrow Module — Creating Escrow Agreement with Milestones');
    // ────────────────────────────────────────────────────────────────────────
    const amount = 5000;
    console.log(`Creating escrow agreement for ₦${amount} between ${buyerId} and ${sellerId}...`);
    
    const agreementRes = await axios.post(`${BASE_URL}/escrow/agreements`, {
      buyerExternalId: buyerId,
      sellerExternalId: sellerId,
      buyerEmail: 'buyer@platform.dev',
      buyerName: 'Platform Tester',
      totalAmount: amount,
      milestones: [
        {
          title: 'Milestone A: Source code delivery',
          amount: amount,
        }
      ]
    }, { headers });

    const agreement = agreementRes.data;
    const agreementId = agreement.agreementId;
    const virtualAccountNo = agreement.nombaVirtualAccountNo;
    const milestoneId = agreement.milestones[0].id;

    console.log('✓ Escrow Agreement Created Successfully!');
    console.log(`  - Agreement ID: ${agreementId}`);
    console.log(`  - Virtual Account Number: ${virtualAccountNo}`);
    console.log(`  - Milestone ID: ${milestoneId}`);

    // ────────────────────────────────────────────────────────────────────────
    printSection('3. Fraud Module — Triggering ML Risk Assessment (FastAPI)');
    // ────────────────────────────────────────────────────────────────────────
    console.log('Analyzing transaction risk using local XGBoost/LightGBM model...');
    const riskRes = await axios.post(`${BASE_URL}/escrow/agreements/${agreementId}/assess`, {
      externalUserId: buyerId,
      ipAddress: '197.210.84.1',
      deviceFingerprint: 'fingerprint_platform_001',
    }, { headers });

    const riskData = riskRes.data;
    console.log('✓ Fraud Engine Assessment Result:');
    console.log(`  - Flag: ${riskData.flag} (${riskData.category})`);
    console.log(`  - Recommendation: ${riskData.recommendation}`);
    console.log(`  - Final Risk Score: ${riskData.score}/100`);
    console.log(`  - Triggered Signals: ${JSON.stringify(riskData.triggeredSignals)}`);

    // ────────────────────────────────────────────────────────────────────────
    printSection('4. Webhook Reconciliation — Simulating Inbound Bank Transfer');
    // ────────────────────────────────────────────────────────────────────────
    const webhookPayload = {
      eventType: 'virtual_account.funded',
      requestId: 'req-' + Math.random().toString(36).substring(2, 10),
      data: {
        accountNumber: virtualAccountNo,
        amount: amount * 100, // Convert to kobo
        senderName: 'Platform Tester',
        senderBank: 'Wema Bank',
        senderAccount: '0123456789',
      }
    };

    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    console.log(`Posting signed payment webhook for account ${virtualAccountNo} (Amount: ₦${amount})...`);
    await axios.post(`${BASE_URL}/escrow/webhooks/nomba`, rawBody, {
      headers: {
        'Content-Type': 'application/json',
        'nomba-signature': signature,
      }
    });

    console.log('Webhook dispatched. Waiting 2 seconds for asynchronous DB reconciliation...');
    await sleep(2000);

    // ────────────────────────────────────────────────────────────────────────
    printSection('5. Customer Statement — Verifying Funded Status');
    // ────────────────────────────────────────────────────────────────────────
    console.log('Fetching agreement statement view...');
    const statementRes = await axios.get(`${BASE_URL}/escrow/agreements/${agreementId}/statement`, { headers });
    const stmt = statementRes.data;

    console.log('✓ Statement Retrieved:');
    console.log(`  - Agreement Status: ${stmt.status}`);
    console.log(`  - Total Expected: ₦${stmt.totalExpected}`);
    console.log(`  - Amount Received: ₦${stmt.amountReceived}`);
    console.log(`  - Shortfall: ₦${stmt.shortfall}`);
    console.log(`  - Inbound Transfers: ${stmt.transfers.length} matched`);
    stmt.transfers.forEach((t) => {
      console.log(`    * [${t.timestamp}] ₦${t.amount} from ${t.senderName} (${t.senderBank}) - Ref: ${t.reference}`);
    });

    // ────────────────────────────────────────────────────────────────────────
    printSection('6. Escrow Disbursement — Releasing Milestone Funds to Seller');
    // ────────────────────────────────────────────────────────────────────────
    console.log(`Confirming and releasing milestone ${milestoneId} to seller...`);
    const confirmRes = await axios.post(`${BASE_URL}/escrow/agreements/${agreementId}/milestones/${milestoneId}/confirm`, {
      externalUserId: buyerId,
      sellerAccountNumber: '0554772814',
      sellerBankCode: '058',
    }, { headers });

    console.log('✓ Milestone Funds Released!');
    console.log(`  - Status: ${confirmRes.data.message}`);
    console.log(`  - Agreement Status: ${confirmRes.data.agreementStatus}`);
    console.log(`  - Milestone Status: ${confirmRes.data.milestone.status}`);
    console.log(`  - Nomba Transfer Reference: ${confirmRes.data.milestone.nombaTransactionId}`);

    // ────────────────────────────────────────────────────────────────────────
    printSection('7. Final Customer Statement View');
    // ────────────────────────────────────────────────────────────────────────
    const finalStmtRes = await axios.get(`${BASE_URL}/escrow/agreements/${agreementId}/statement`, { headers });
    const fs = finalStmtRes.data;

    console.log(JSON.stringify(fs, null, 2));

    console.log('\n✅ END-TO-END FLOW COMPLETED SUCCESSFULLY!');

  } catch (error) {
    console.error('\n❌ Execution Failed!');
    if (error.response) {
      console.error(`Status Code: ${error.response.status}`);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Details:', error.message);
    }
  }
}

run();
