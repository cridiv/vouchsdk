const axios = require('axios');

const client_id = process.env.NOMBA_CLIENT_ID || '706df6c4-b8bb-4130-88c4-d21b052f8631';
const client_secret = process.env.NOMBA_CLIENT_SECRET || 'k8UobYk3APgOoxUnNL7VpuxzwTsH4LsXtydfjcHs8RH0YISBB4OMqJsaafG+U8fWETu9YZ96bNXE+DelCDuMPw==';
const account_id = process.env.NOMBA_ACCOUNT_ID || 'f666ef9b-888e-4799-85ce-acb505b28023';
const sub_account_id = 'f5ee5fa7-2dc0-4030-b28c-3d81002a3285';

async function run() {
  try {
    console.log('1. Issuing Access Token...');
    const tokenRes = await axios.post('https://sandbox.nomba.com/v1/auth/token/issue', {
      grant_type: 'client_credentials',
      client_id,
      client_secret
    }, {
      headers: {
        accountId: account_id,
        'Content-Type': 'application/json'
      }
    });

    const token = tokenRes.data.data.access_token;
    console.log('✓ Token issued successfully! (length:', token.length, ')');

    // Test Parent Account Virtual Creation
    console.log('\n2. Testing Parent Account Virtual Creation...');
    try {
      const parentRes = await axios.post('https://sandbox.nomba.com/v1/accounts/virtual', {
        accountRef: 'test-parent-' + Date.now(),
        accountName: 'Test Parent Account',
        expiryDate: null
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          accountId: account_id
        }
      });
      console.log('✓ Parent Account VA Success:', parentRes.data);
    } catch (err) {
      console.error('✗ Parent Account VA Failed:');
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', JSON.stringify(err.response.data, null, 2));
      } else {
        console.error('Error:', err.message);
      }
    }

    // Test Sub Account Virtual Creation
    console.log('\n3. Testing Sub Account Virtual Creation...');
    try {
      const subRes = await axios.post(`https://sandbox.nomba.com/v1/accounts/virtual/${sub_account_id}`, {
        accountRef: 'test-sub-' + Date.now(),
        accountName: 'Test Sub Account',
        expiryDate: null
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          accountId: account_id
        }
      });
      console.log('✓ Sub Account VA Success:', subRes.data);
    } catch (err) {
      console.error('✗ Sub Account VA Failed:');
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', JSON.stringify(err.response.data, null, 2));
      } else {
        console.error('Error:', err.message);
      }
    }

  } catch (err) {
    console.error('✗ Token Issue Failed:', err.response ? err.response.data : err.message);
  }
}

run();
