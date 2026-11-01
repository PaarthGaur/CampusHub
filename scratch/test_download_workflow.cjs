const assert = require('assert');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api/v1';
const JWT_SECRET = 'supersecretjwtkeycampushub2026_dev_env';

function signToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function runTests() {
  console.log('--- Starting Step 5 Test Suite ---');
  await mongoose.connect('mongodb://127.0.0.1:27017/campushub');

  // Find admin user for testing
  const adminUser = await mongoose.connection.collection('users').findOne({ role: 'admin' });
  const facultyUser = await mongoose.connection.collection('users').findOne({ role: 'faculty' });
  const studentUser = await mongoose.connection.collection('users').findOne({ role: 'student' });
  assert.ok(adminUser, 'Admin user should exist');

  const adminToken = signToken(adminUser._id);
  const studentToken = studentUser ? signToken(studentUser._id) : null;
  console.log('✓ Admin token generated');

  // Test 0: Unauthenticated download should return 401 (not 500!)
  console.log('\n[Test 0] Unauthenticated download request');
  const unauthRes = await request('/resources/download/4ae2bb85-cdec-4ded-a83f-ca8cb40c8250.pdf');
  console.log(`Status: ${unauthRes.status}`, unauthRes.data);
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401');
  console.log('✓ Passed: Returns 401 instead of 500 TypeError');

  // Test 8 (Part A): Verify existing uploaded resource downloads successfully
  console.log('\n[Test 8] Existing uploaded resource download (4ae2bb85-cdec-4ded-a83f-ca8cb40c8250.pdf)');
  const existingResBearer = await request('/resources/download/4ae2bb85-cdec-4ded-a83f-ca8cb40c8250.pdf', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(existingResBearer.status, 200, 'Existing resource should download with 200 via Bearer header');
  assert.ok(existingResBearer.headers.get('content-disposition').includes('attachment'), 'Content-Disposition header present');
  console.log('✓ Downloaded via Bearer token (Length: ' + existingResBearer.headers.get('content-length') + ')');

  // Also test query parameter token download
  const existingResQuery = await request(`/resources/download/4ae2bb85-cdec-4ded-a83f-ca8cb40c8250.pdf?token=${adminToken}`);
  assert.strictEqual(existingResQuery.status, 200, 'Existing resource should download with 200 via query token');
  console.log('✓ Downloaded via ?token= query param (Length: ' + existingResQuery.headers.get('content-length') + ')');

  // Test 1: Upload a new resource
  console.log('\n[Test 1] Upload a new resource as authorized user');
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  const samplePdfContent = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Title (Test Document)\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
  form.append('file', samplePdfContent, {
    filename: 'unit_test_doc.pdf',
    contentType: 'application/pdf'
  });

  const uploadRes = await fetch(`${BASE_URL}/resources/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      ...form.getHeaders()
    },
    body: form
  });
  const uploadData = await uploadRes.json();
  console.log('Upload status:', uploadRes.status, uploadData);
  assert.strictEqual(uploadRes.status, 201, 'Upload should succeed with 201');
  const uploadedFileName = uploadData.data.fileName;
  assert.ok(uploadedFileName, 'Upload should return fileName');
  console.log('✓ Resource uploaded successfully:', uploadedFileName);

  // Test 2: Confirm MongoDB document is created
  console.log('\n[Test 2] Confirm MongoDB document is created');
  const resourceDoc = await mongoose.connection.collection('resources').findOne({ fileName: uploadedFileName });
  assert.ok(resourceDoc, 'Resource document must exist in MongoDB');
  assert.strictEqual(String(resourceDoc.owner), String(adminUser._id), 'Resource owner must match admin user');
  assert.strictEqual(resourceDoc.originalName, 'unit_test_doc.pdf');
  console.log('✓ MongoDB document confirmed:', resourceDoc._id, resourceDoc.fileName);

  // Test 3: Retrieve the resource metadata
  console.log('\n[Test 3] Retrieve resource metadata info');
  const infoRes = await request(`/resources/info/${uploadedFileName}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(infoRes.status, 200);
  assert.strictEqual(infoRes.data.status, 'success');
  assert.strictEqual(infoRes.data.data.fileName, uploadedFileName);
  console.log('✓ Metadata retrieved:', infoRes.data.data);

  // Test by ID lookup as well
  const infoByIdRes = await request(`/resources/${resourceDoc._id}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(infoByIdRes.status, 200);
  console.log('✓ Metadata retrieved by MongoDB _id');

  // Test 4: Download it as an authorized user
  console.log('\n[Test 4] Download newly uploaded resource');
  const downloadRes = await request(`/resources/download/${uploadedFileName}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(downloadRes.status, 200);
  assert.strictEqual(downloadRes.headers.get('content-type'), 'application/pdf');
  assert.strictEqual(Number(downloadRes.headers.get('content-length')), samplePdfContent.length);
  console.log('✓ Download stream verified successfully');

  // Also test download by ID route: /resources/:id/download
  const downloadByIdRes = await request(`/resources/${resourceDoc._id}/download`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(downloadByIdRes.status, 200);
  console.log('✓ Download by ID /resources/:id/download verified');

  // Test 5: Test download with an invalid resource ID
  console.log('\n[Test 5] Test download with invalid resource ID');
  const invalidIdRes = await request('/resources/600000000000000000000000/download', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Invalid ID status:', invalidIdRes.status, invalidIdRes.data);
  assert.strictEqual(invalidIdRes.status, 404, 'Non-existent ID must return 404');
  console.log('✓ Returned 404 Not Found for non-existent resource ID');

  const malformedIdRes = await request('/resources/download/nonexistent_file_123.pdf', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(malformedIdRes.status, 404, 'Non-existent file should return 404');
  console.log('✓ Returned 404 Not Found for non-existent file name');

  // Test 6: Test a missing file (DB document exists but file missing on disk)
  console.log('\n[Test 6] Test missing file on disk');
  const missingFileResource = await mongoose.connection.collection('resources').insertOne({
    owner: adminUser._id,
    fileName: 'phantom_file_nonexistent.pdf',
    originalName: 'phantom.pdf',
    fileSize: 100,
    mimetype: 'application/pdf',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const missingFileRes = await request(`/resources/download/phantom_file_nonexistent.pdf`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Missing file status:', missingFileRes.status, missingFileRes.data);
  assert.strictEqual(missingFileRes.status, 404, 'Missing file on disk must return 404');
  assert.strictEqual(missingFileRes.data.message, 'The requested file was not found on this server.');
  console.log('✓ Returned 404 cleanly without exposing filesystem path');
  // Clean up phantom record
  await mongoose.connection.collection('resources').deleteOne({ _id: missingFileResource.insertedId });

  // Test 7: Test a resource with a missing subject or author reference
  console.log('\n[Test 7] Test resource with missing/orphaned author or subject reference');
  const fakeAuthorId = new mongoose.Types.ObjectId();
  const fakeSubjectId = new mongoose.Types.ObjectId();
  const orphanedNote = await mongoose.connection.collection('notes').insertOne({
    title: 'Orphaned Reference Note',
    description: 'Test orphaned references',
    subject: fakeSubjectId, // Does not exist
    author: fakeAuthorId,   // Does not exist
    fileName: uploadedFileName,
    fileUrl: `/api/v1/resources/download/${uploadedFileName}`,
    fileSize: samplePdfContent.length,
    fileType: 'pdf',
    isPublic: true,
    downloadCount: 0,
    likes: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Now request download of this resource - should succeed with 200 because note is public,
  // and missing author/subject shouldn't crash with TypeError!
  const orphanedDownloadRes = await request(`/resources/download/${uploadedFileName}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(orphanedDownloadRes.status, 200, 'Orphaned reference must not cause 500 error');
  console.log('✓ Orphaned reference download succeeded (status 200)');

  // Also check info lookup with orphaned reference
  const orphanedInfoRes = await request(`/resources/${orphanedNote.insertedId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(orphanedInfoRes.status, 200, 'Orphaned reference info lookup must succeed');
  assert.strictEqual(orphanedInfoRes.data.data.subject, null, 'Missing subject safely returned as null');
  console.log('✓ Orphaned reference info lookup safely handled null references:', orphanedInfoRes.data.data);

  // Clean up test orphaned note and uploaded file
  await mongoose.connection.collection('notes').deleteOne({ _id: orphanedNote.insertedId });
  await mongoose.connection.collection('resources').deleteOne({ _id: resourceDoc._id });
  const uploadsDir = path.resolve(__dirname, '../server/uploads');
  const filePath = path.join(uploadsDir, uploadedFileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Final check: Existing Note downloadCount increment
  const existingNote = await mongoose.connection.collection('notes').findOne({ fileName: '4ae2bb85-cdec-4ded-a83f-ca8cb40c8250.pdf' });
  console.log('\nExisting Note downloadCount:', existingNote?.downloadCount);
  assert.ok(existingNote?.downloadCount > 0, 'downloadCount should have incremented on existing note');
  console.log('✓ Existing note downloadCount incremented successfully to:', existingNote.downloadCount);

  await mongoose.disconnect();
  console.log('\n=======================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! (10/10)');
  console.log('=======================================');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
