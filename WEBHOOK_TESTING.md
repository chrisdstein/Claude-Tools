# Webhook Testing Server

A simple Express-based webhook server for testing webhook functionality.

## Quick Start

```bash
npm run webhook
```

The server will start on `http://localhost:3000` by default.

## Endpoints

### POST /webhook
Main webhook endpoint for testing POST requests.

**Example:**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {"message": "Hello World"}}'
```

### GET /health
Health check endpoint to verify the server is running.

**Example:**
```bash
curl http://localhost:3000/health
```

### Catch-all: * (any path)
The server accepts requests to any path with any HTTP method for maximum flexibility during testing.

**Example:**
```bash
curl -X POST http://localhost:3000/custom/webhook/path \
  -H "Content-Type: application/json" \
  -d '{"custom": "data"}'
```

## Configuration

Set a custom port using the `PORT` environment variable:

```bash
PORT=8080 npm run webhook
```

## What Gets Logged

The webhook server logs the following information for each request:

- Timestamp
- HTTP method
- Request path
- All headers
- Request body
- Query parameters (if any)

## Example Output

When you send a webhook request, the server will display:

```
================================================================================
[2026-02-15T10:30:45.123Z] Incoming POST request to /webhook
================================================================================

📨 WEBHOOK RECEIVED
--------------------------------------------------------------------------------

📋 HEADERS:
{
  "content-type": "application/json",
  "user-agent": "curl/7.68.0",
  "accept": "*/*",
  ...
}

📦 BODY:
{
  "event": "test",
  "data": {
    "message": "Hello World"
  }
}

--------------------------------------------------------------------------------
```

## Response Format

All requests receive a JSON response:

```json
{
  "success": true,
  "message": "Webhook received successfully",
  "timestamp": "2026-02-15T10:30:45.123Z",
  "receivedData": {
    "headers": {...},
    "body": {...},
    "query": {...}
  }
}
```

## Testing Different Scenarios

### Test with headers

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Custom-Header: test-value" \
  -H "Authorization: Bearer token123" \
  -d '{"test": "data"}'
```

### Test with query parameters

```bash
curl -X POST "http://localhost:3000/webhook?source=github&event=push" \
  -H "Content-Type: application/json" \
  -d '{"repository": "my-repo"}'
```

### Test with form data

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "key1=value1&key2=value2"
```

### Test with different HTTP methods

```bash
# PUT request
curl -X PUT http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"method": "PUT"}'

# PATCH request
curl -X PATCH http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"method": "PATCH"}'

# DELETE request
curl -X DELETE http://localhost:3000/webhook
```

## Using with External Webhook Services

To test with external services (GitHub, Stripe, etc.), you'll need to expose your local server using a tool like:

- [ngrok](https://ngrok.com/): `ngrok http 3000`
- [localtunnel](https://localtunnel.github.io/www/): `lt --port 3000`
- [serveo](https://serveo.net/): `ssh -R 80:localhost:3000 serveo.net`

Then use the public URL provided by these tools as your webhook endpoint.

## Stopping the Server

Press `Ctrl+C` in the terminal to stop the webhook server.
