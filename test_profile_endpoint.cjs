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
    // 1. Login owner
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      email: 'owner@sharmaflourmill.com',
      password: 'sharma123'
    });
    const token = loginRes.data.token;
    console.log('Login token acquired:', !!token);

    // 2. GET Profile
    const profileRes = await makeRequest('/api/shop/profile', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log('GET Profile status:', profileRes.status, 'Shop Name:', profileRes.data.shopName);

    // 3. PUT Profile update
    const updateRes = await makeRequest('/api/shop/profile', 'PUT', {
      ownerName: 'Ramesh Sharma',
      operatingHours: '8:00 AM - 9:00 PM',
      notificationRules: {
        enableWebPush: true
      },
      services: [
        { name: 'Wheat Atta', unit: 'kg', rate: 5 },
        { name: 'Besan (Gram)', unit: 'kg', rate: 10 }
      ]
    }, { Authorization: `Bearer ${token}` });

    console.log('PUT Profile status:', updateRes.status, 'Message:', updateRes.data.message);

    // 4. Verify updated values via GET
    const verifyRes = await makeRequest('/api/shop/profile', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log('Updated Owner Name:', verifyRes.data.ownerName);
    console.log('Updated Operating Hours:', verifyRes.data.operatingHours);
    console.log('Updated Web Push rule:', verifyRes.data.notificationRules.enableWebPush);
    console.log('Updated Services count:', verifyRes.data.services.length);

    if (
      verifyRes.data.ownerName === 'Ramesh Sharma' &&
      verifyRes.data.notificationRules.enableWebPush === true &&
      verifyRes.data.services.length === 2
    ) {
      console.log('✅ PROFILE ENDPOINTS TEST PASSED!');
    } else {
      console.error('❌ PROFILE ENDPOINTS TEST FAILED!');
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

runTest();
