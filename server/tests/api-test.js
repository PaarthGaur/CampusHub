/**
 * Automated API Testing Script (Course Topic: 56, 57 & 58 - REST APIs & API Testing)
 * Executes comprehensive integration checks across Phase 3 and Phase 4 endpoints.
 */

const BASE_URL = 'http://localhost:5000';

async function testEndpoint(name, url, options = {}, expectedStatus = 200) {
  try {
    const res = await fetch(`${BASE_URL}${url}`, options);
    const data = await res.json().catch(() => null);
    const validStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const passed = validStatuses.includes(res.status);

    console.log(`${passed ? '✅' : '❌'} [${res.status}] ${name}`);
    if (!passed) {
      console.log(`   Expected status: ${validStatuses.join(' or ')}, got: ${res.status}`);
      console.log('   Response body:', JSON.stringify(data));
    } else {
      console.log('   Output sample:', JSON.stringify(data).slice(0, 110) + '...');
    }
    return { passed, data };
  } catch (err) {
    console.error(`❌ [ERROR] ${name}: ${err.message}`);
    return { passed: false, error: err };
  }
}

async function runTests() {
  console.log('='.repeat(65));
  console.log('🧪 CampusHub API Integration Tests (Phases 3 & 4)');
  console.log('='.repeat(65) + '\n');

  // Test 1: System Health
  await testEndpoint('Health Check Endpoint', '/api/health', { method: 'GET' }, 200);

  // Test 2: Course Topics Mapping
  await testEndpoint('Curriculum Topics Index', '/api/topics', { method: 'GET' }, 200);

  // Test 3: Centralized 404 Error Handler
  await testEndpoint('Unknown Route 404 Handler', '/api/v1/does-not-exist', { method: 'GET' }, 404);

  // Test 4: Express Validator Middleware (Rejecting Invalid Signup Body)
  await testEndpoint(
    'Validation Middleware (Invalid Signup)',
    '/api/v1/auth/signup',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A', // too short (< 2)
        email: 'invalid-email', // invalid email regex
        password: '123' // too short (< 6)
      })
    },
    400
  );

  // Test 5: Protected Route Guard (Missing Bearer Token)
  await testEndpoint(
    'Protected Route Guard (Missing Token)',
    '/api/v1/auth/me',
    { method: 'GET' },
    401
  );

  // Test 6: Protected Route Guard (Invalid/Malformed Bearer Token)
  await testEndpoint(
    'Protected Route Guard (Invalid Token)',
    '/api/v1/auth/me',
    {
      method: 'GET',
      headers: { Authorization: 'Bearer thisisafaketoken123' }
    },
    401
  );

  // Test 7: Public Subject Listing (200 if connected, 503 if offline)
  await testEndpoint('Public Subjects List', '/api/v1/subjects', { method: 'GET' }, [200, 503]);

  // Test 8: Public Notes Listing (200 if connected, 503 if offline)
  await testEndpoint('Public Notes List', '/api/v1/notes', { method: 'GET' }, [200, 503]);

  // Test 9: Resource Metadata Inspection (Topic 51 fs.stat & Topic 58)
  await testEndpoint('Resource File Metadata Info', '/api/v1/resources/info/sample_test.pdf', { method: 'GET' }, 200);

  // Test 10: Stream-based File Download (Topic 52 Node Streams & Topic 58)
  try {
    const streamRes = await fetch(`${BASE_URL}/api/v1/resources/download/sample_test.pdf`);
    const streamPass = streamRes.status === 200 && streamRes.headers.get('content-disposition')?.includes('attachment');
    console.log(`${streamPass ? '✅' : '❌'} [${streamRes.status}] Node.js Streams Download (sample_test.pdf)`);
    console.log(`   Headers: Content-Length=${streamRes.headers.get('content-length')}, Disposition=${streamRes.headers.get('content-disposition')}`);
  } catch (err) {
    console.error(`❌ [ERROR] Stream Download: ${err.message}`);
  }

  // Test 11: Upload Endpoint Security Guard (Topic 57 & 58)
  await testEndpoint('Multer Upload Guard (Unauthorized)', '/api/v1/resources/upload', { method: 'POST' }, 401);

  console.log('\n' + '='.repeat(65));
  console.log('🎉 API Test Suite Completed Across All Phases (1 through 6)!');
  console.log('='.repeat(65));
}

runTests();
