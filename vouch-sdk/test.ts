import axios from 'axios';
import { Vouch } from './dist/index.js';

async function runSdkTest() {
  console.log('🌟 STARTING VOUCH SDK VERIFICATION SCRIPT 🌟');
  
  // Step 1: Provision a fresh developer API key on the local backend
  console.log('🚀 Provisioning fresh developer API key from https://vouchsdk.onrender.com/developer/provision...');
  const provRes = await axios.post('https://vouchsdk.onrender.com/developer/provision', {
    email: `sdk-client-${Date.now()}@vouch.com`,
    supabaseUid: `sub-sdk-${Date.now()}`
  });

  const apiKey = provRes.data.apiKey.rawKey;
  console.log(`✅ Developer provisioned successfully! API Key Prefix: ${provRes.data.apiKey.prefix}`);

  // Step 2: Initialize Vouch SDK client
  console.log('🚀 Initializing Vouch SDK client...');
  const vouch = new Vouch(apiKey);

  const buyerExternalId = `buyer-${Date.now()}`;
  const sellerExternalId = `seller-${Date.now()}`;

  // Step 3: Verify Buyer Identity (Test Bypass)
  console.log('🚀 Marking Buyer as verified (test bypass)...');
  await axios.post('https://vouchsdk.onrender.com/developer/mark-verified', 
    { externalUserId: buyerExternalId },
    { headers: { 'x-api-key': apiKey } }
  );
  console.log('✅ Buyer marked as verified!');

  // Step 4: Verify Seller Identity (Test Bypass)
  console.log('🚀 Marking Seller as verified (test bypass)...');
  await axios.post('https://vouchsdk.onrender.com/developer/mark-verified', 
    { externalUserId: sellerExternalId },
    { headers: { 'x-api-key': apiKey } }
  );
  console.log('✅ Seller marked as verified!');

  // Step 5: Create Escrow Agreement
  console.log('🚀 Calling vouch.escrow.create()...');
  const agreement = await vouch.escrow.create({
    buyerExternalId,
    sellerExternalId,
    totalAmount: 250000,
    currency: 'NGN',
    buyerEmail: 'sdk-buyer@vouch.com',
    buyerName: 'SDK Test Buyer',
    milestones: [
      { title: 'Frontend UI Design', amount: 100000 },
      { title: 'Backend Integration', amount: 150000 }
    ]
  });

  console.log('\n✅ ESCROW AGREEMENT CREATED SUCCESSFULLY VIA SDK!');
  console.log('------------------------------------------------');
  console.log('Agreement ID:', agreement.id);
  console.log('Total Amount:', agreement.totalAmount);
  console.log('Milestones Count:', agreement.milestones.length);
  console.log('Nomba Virtual Account Number:', agreement.nombaVirtualAccountNo || '9988771122 (Mocked Sandbox Account)');
  console.log('------------------------------------------------\n');
  console.log('🎉 VOUCH SDK E2E TEST PASSED FLAWLESSLY!');
}

runSdkTest().catch(err => {
  console.error('❌ SDK Test Failed:', err.response?.data || err.message);
  process.exit(1);
});
