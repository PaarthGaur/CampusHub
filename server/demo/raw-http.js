/**
 * Raw Node.js HTTP Server & Request-Response Lifecycle
 * Topic Covered: 53 - HTTP Module, Request-Response Lifecycle, Creating HTTP Server, Routing
 * 
 * Shows how Node handles HTTP requests under the hood before using Express.
 */
import http from 'http';

const PORT = 5050;

const server = http.createServer((req, res) => {
  const { method, url, headers } = req;
  console.log(`[HTTP Request] ${method} ${url}`);

  // Set default response headers
  res.setHeader('X-Powered-By', 'Node.js Core HTTP');

  // Simple URL routing
  if (url === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Welcome to CampusHub Raw HTTP Module Server',
      status: 'active',
      topic: 'Topic 53: Native Node.js http.createServer'
    }));
  } else if (url === '/api/info' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      nodeVersion: process.version,
      platform: process.platform,
      serverTime: new Date().toISOString(),
      userAgent: headers['user-agent']
    }));
  } else if (url === '/api/echo' && method === 'POST') {
    // Collecting request body stream chunks
    let body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    });
    req.on('end', () => {
      const parsedBody = Buffer.concat(body).toString();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        received: true,
        data: parsedBody ? JSON.parse(parsedBody) : {}
      }));
    });
  } else {
    // 404 Not Found route
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found on raw HTTP server' }));
  }
});

server.listen(PORT, () => {
  console.log(`[Raw HTTP Server] Running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop or run Express server on PORT 5000');
});
