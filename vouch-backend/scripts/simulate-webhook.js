const crypto = require('crypto');
const axios = require('axios');

// 1. Configuration
const url = 'http://localhost:5000/escrow/webhooks/nomba';
const secret = process.env.NOMBA_WEBHOOK_SECRET || 'NombaHackathon2026';

// 2. Parse arguments
const args = process.argv.slice(2);
const accountNumber = args[0];
const amountNaira = parseFloat(args[1] || '1000'); // default ₦1,000

if (!accountNumber) {
  console.log('\nUsage: node simulate-webhook.js <accountNumber> [amountInNaira]');
  console.log('Example: node simulate-webhook.js 9391076543 5000\n');
  process.exit(1);
}

// 3. Construct webhook payload (in kobo)
const payload = {
  eventType: 'virtual_account.funded',
  requestId: 'test-req-' + Math.random().toString(36).substring(2, 10),
  data: {
    accountNumber: accountNumber,
    amount: amountNaira * 100, // Convert to kobo
    senderName: 'Test Buyer',
    senderBank: 'Wema Bank',
    senderAccount: '0123456789'
  }
};

const rawBody = JSON.stringify(payload);

// 4. Generate HMAC-SHA256 signature
const signature = crypto
  .createHmac('sha256', secret)
  .update(rawBody)
  .digest('hex');

console.log(`Sending webhook simulation for account: ${accountNumber}`);
console.log(`Amount: ₦${amountNaira}`);
console.log(`Generated Signature: ${signature}`);

// 5. POST to local backend
axios.post(url, rawBody, {
  headers: {
    'Content-Type': 'application/json',
    'nomba-signature': signature
  }
})
.then(res => {
  console.log(`\nStatus Code: ${res.status}`);
  console.log('Response:', res.data || 'OK');
  console.log('\nCheck your NestJS server logs to see the reconciliation output!');
})
.catch(err => {
  console.error('\nWebhook call failed!');
  if (err.response) {
    console.error(`Status Code: ${err.response.status}`);
    console.error('Response:', err.response.data);
  } else {
    console.error('Error:', err.message);
  }
});
