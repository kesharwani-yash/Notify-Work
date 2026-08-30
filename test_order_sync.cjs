const { io } = require('./frontend/node_modules/socket.io-client');

async function runTest() {
  const shopId = 'sharma-flour-mill';
  const backendUrl = 'http://localhost:5000';

  console.log('1. Submitting test order...');
  const res = await fetch(`${backendUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopIdSlug: shopId,
      name: 'Realtime Test User',
      phone: '9988776655',
      item: 'Wheat 10kg',
      weight: 10,
      remarks: 'Fast test'
    })
  });
  const order = await res.json();
  const orderId = order._id;
  console.log('Order created ID:', orderId, 'Initial Status:', order.status);

  // Login as owner to get auth token
  const loginRes = await fetch(`${backendUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@sharmaflourmill.com',
      password: 'sharma123'
    })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    process.exit(1);
  }
  const token = loginData.token;
  console.log('Owner logged in successfully. Token acquired.');

  // Connect socket.io client
  const socket = io(backendUrl);
  const receivedStatuses = [];

  await new Promise((resolve) => {
    socket.on('connect', () => {
      console.log('Socket connected, joining order room:', orderId);
      socket.emit('join-order', orderId);
      resolve();
    });
  });

  socket.on('order-update', (data) => {
    const status = data.status || data.order?.status;
    console.log('⚡ Socket event [order-update] received:', {
      orderId: data.orderId,
      status: status
    });
    if (status) receivedStatuses.push(status);
  });

  // Small delay to ensure socket room joined
  await new Promise(r => setTimeout(r, 600));

  console.log('\n2. Testing acceptOrder (Pending -> Accepted)...');
  const acceptRes = await fetch(`${backendUrl}/api/orders/${orderId}/accept`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Accept HTTP response status:', acceptRes.status);
  await new Promise(r => setTimeout(r, 600));

  console.log('\n3. Testing readyOrder (Accepted -> Ready)...');
  const readyRes = await fetch(`${backendUrl}/api/orders/${orderId}/ready`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Ready HTTP response status:', readyRes.status);
  await new Promise(r => setTimeout(r, 600));

  console.log('\n4. Testing collectedOrder (Ready -> Collected)...');
  const collectedRes = await fetch(`${backendUrl}/api/orders/${orderId}/collected`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Collected HTTP response status:', collectedRes.status);
  await new Promise(r => setTimeout(r, 600));

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log('Received WebSocket Status Updates:', receivedStatuses);
  
  const expected = ['Accepted', 'Ready', 'Collected'];
  const allMatched = expected.every(status => receivedStatuses.includes(status));

  if (allMatched) {
    console.log('✅ TEST PASSED: All order status transitions synchronized in real-time over WebSockets!');
  } else {
    console.error('❌ TEST FAILED: Missing status transitions!', { expected, receivedStatuses });
  }

  socket.disconnect();
  process.exit(allMatched ? 0 : 1);
}

runTest().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
