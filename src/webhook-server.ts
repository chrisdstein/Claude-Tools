import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Middleware to log all requests
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${timestamp}] Incoming ${req.method} request to ${req.path}`);
  console.log(`${'='.repeat(80)}`);
  next();
});

// Main webhook endpoint
app.post('/webhook', (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();

  console.log('\n📨 WEBHOOK RECEIVED');
  console.log('-'.repeat(80));

  // Log headers
  console.log('\n📋 HEADERS:');
  console.log(JSON.stringify(req.headers, null, 2));

  // Log body
  console.log('\n📦 BODY:');
  console.log(JSON.stringify(req.body, null, 2));

  // Log query parameters if any
  if (Object.keys(req.query).length > 0) {
    console.log('\n🔍 QUERY PARAMETERS:');
    console.log(JSON.stringify(req.query, null, 2));
  }

  console.log('\n' + '-'.repeat(80));

  // Send success response
  res.status(200).json({
    success: true,
    message: 'Webhook received successfully',
    timestamp,
    receivedData: {
      headers: req.headers,
      body: req.body,
      query: req.query
    }
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Webhook server is running',
    timestamp: new Date().toISOString()
  });
});

// Catch-all endpoint for testing different paths
app.all('*', (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();

  console.log('\n📨 REQUEST RECEIVED');
  console.log('-'.repeat(80));
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);

  console.log('\n📋 HEADERS:');
  console.log(JSON.stringify(req.headers, null, 2));

  if (Object.keys(req.body).length > 0) {
    console.log('\n📦 BODY:');
    console.log(JSON.stringify(req.body, null, 2));
  }

  if (Object.keys(req.query).length > 0) {
    console.log('\n🔍 QUERY PARAMETERS:');
    console.log(JSON.stringify(req.query, null, 2));
  }

  console.log('\n' + '-'.repeat(80));

  res.status(200).json({
    success: true,
    message: `${req.method} request received at ${req.path}`,
    timestamp,
    receivedData: {
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body,
      query: req.query
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 WEBHOOK TEST SERVER STARTED');
  console.log('='.repeat(80));
  console.log(`\n📍 Server running on: http://localhost:${PORT}`);
  console.log(`\n📌 Endpoints:`);
  console.log(`   POST http://localhost:${PORT}/webhook - Main webhook endpoint`);
  console.log(`   GET  http://localhost:${PORT}/health  - Health check`);
  console.log(`   *    http://localhost:${PORT}/*       - Catch-all for any path\n`);
  console.log('='.repeat(80));
  console.log('\n✅ Ready to receive webhooks!\n');
});
