const http = require('http');

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  try {
    // 1. Create order
    const createRes = await makeRequest('/api/orders', 'POST', {
      shopIdSlug: 'sharma-flour-mill',
      name: 'Search Test Customer',
      phone: '9998887776',
      item: 'Ragi Flour',
      weight: 15,
      remarks: 'Special grinding'
    });

    console.log('Created order ID:', createRes.data._id);

    // 2. Login owner
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      email: 'owner@sharmaflourmill.com',
      password: 'sharma123'
    });
    const token = loginRes.data.token;
    console.log('Token acquired:', !!token);

    // 3. Search by name
    const searchName = await makeRequest('/api/orders/search?q=Search%20Test', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log('Search by Customer Name count:', searchName.data.length);

    // 4. Search by phone
    const searchPhone = await makeRequest('/api/orders/search?q=999888', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log('Search by Phone count:', searchPhone.data.length);

    // 5. Search by item
    const searchItem = await makeRequest('/api/orders/search?q=Ragi', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log('Search by Item count:', searchItem.data.length);

    // 6. Search by weight
    const searchWeight = await makeRequest('/api/orders/search?q=15', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log('Search by Weight count:', searchWeight.data.length);

    if (searchName.data.length > 0 && searchPhone.data.length > 0 && searchItem.data.length > 0 && searchWeight.data.length > 0) {
      console.log('✅ ALL SEARCH TESTS PASSED SUCCESSFULLY!');
    } else {
      console.error('❌ SEARCH TEST FAILED');
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

runTest();
