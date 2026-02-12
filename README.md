# Gmail MCP Server

A Model Context Protocol (MCP) server that enables Claude to send emails via the Gmail API. This server provides a secure, OAuth2-authenticated way to send emails directly from Claude conversations.

## Features

- ✉️ Send emails via Gmail API
- 📎 Support for attachments
- 👥 Multiple recipients (To, CC, BCC)
- 🎨 HTML and plain text emails
- 🔐 Secure OAuth2 authentication
- 🔄 Automatic token refresh

## Prerequisites

- Node.js (v18 or higher)
- A Gmail account
- Google Cloud project with Gmail API enabled

## Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### Step 2: Create OAuth2 Credentials

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose application type: "Desktop app"
4. Give it a name (e.g., "Gmail MCP Server")
5. Click "Create"
6. Download the credentials JSON file
7. Save it as `credentials.json` in the project root directory (`/home/user/Claude-Tools/credentials.json`)

### Step 3: Install Dependencies

```bash
cd /home/user/Claude-Tools
npm install
```

### Step 4: Build the Project

```bash
npm run build
```

### Step 5: First-Time Authorization

The first time you run the server, you'll need to authorize it:

1. Start the server (it will be started automatically when Claude Desktop launches)
2. Check the MCP server logs for an authorization URL
3. Visit the URL in your browser
4. Sign in with your Gmail account
5. Grant the requested permissions
6. You'll receive an authorization code

To complete the authorization:

1. Create the credentials directory:
   ```bash
   mkdir -p /home/user/Claude-Tools/credentials
   ```

2. Exchange the authorization code for tokens using this script:
   ```bash
   node -e "
   const { google } = require('googleapis');
   const fs = require('fs');

   const credentials = JSON.parse(fs.readFileSync('credentials.json'));
   const {client_id, client_secret, redirect_uris} = credentials.installed || credentials.web;
   const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

   const code = 'PASTE_YOUR_CODE_HERE';
   oauth2Client.getToken(code, (err, token) => {
     if (err) return console.error('Error:', err);
     fs.mkdirSync('credentials', { recursive: true });
     fs.writeFileSync('credentials/token.json', JSON.stringify(token, null, 2));
     console.log('Token saved to credentials/token.json');
   });
   "
   ```

   Replace `PASTE_YOUR_CODE_HERE` with the authorization code from the browser.

### Step 6: Configure Claude Desktop

Add this configuration to your Claude Desktop config file:

**macOS/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gmail-send": {
      "command": "node",
      "args": ["/home/user/Claude-Tools/dist/index.js"]
    }
  }
}
```

**Note:** Make sure to use the absolute path to the `dist/index.js` file.

### Step 7: Restart Claude Desktop

Restart Claude Desktop to load the new MCP server.

## Usage

Once configured, you can ask Claude to send emails:

### Basic Email
```
Send an email to john@example.com with subject "Meeting Tomorrow" and body "Hi John, Let's meet at 2pm."
```

### HTML Email
```
Send an HTML email to jane@example.com with subject "Welcome!" and body "<h1>Hello!</h1><p>Welcome to our service.</p>"
```

### Email with CC and BCC
```
Send an email to alice@example.com, CC bob@example.com, BCC charlie@example.com with subject "Team Update" and body "Here's the latest update..."
```

### Email with Multiple Recipients
```
Send an email to ["user1@example.com", "user2@example.com"] with subject "Announcement" and body "Important news for everyone."
```

## Tool Reference

### send_email

Send an email via Gmail API.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string \| string[] | Yes | Recipient email address(es) |
| `subject` | string | Yes | Email subject line |
| `body` | string | Yes | Email body content |
| `cc` | string \| string[] | No | CC recipient email address(es) |
| `bcc` | string \| string[] | No | BCC recipient email address(es) |
| `html` | boolean | No | Whether body is HTML (default: false) |
| `attachments` | Attachment[] | No | Email attachments |

**Attachment Object:**

| Field | Type | Description |
|-------|------|-------------|
| `filename` | string | Name of the attachment file |
| `content` | string | Base64 encoded file content |
| `mimeType` | string | MIME type (e.g., "application/pdf") |

**Example Response:**

```json
{
  "success": true,
  "messageId": "18c2f9e8a1234567",
  "threadId": "18c2f9e8a1234567",
  "message": "Email sent successfully"
}
```

## Troubleshooting

### "credentials.json not found"
- Make sure you've downloaded the OAuth2 credentials from Google Cloud Console
- Save the file as `credentials.json` in the project root directory

### "Authorization required"
- Follow the first-time authorization steps above
- Make sure you've created the `credentials/token.json` file

### "Permission denied"
- Verify that Gmail API is enabled in your Google Cloud project
- Check that the OAuth2 credentials have the correct scopes

### "Invalid email format"
- Ensure email addresses are properly formatted
- Check that required fields (to, subject, body) are provided

### Server not appearing in Claude Desktop
- Verify the path in `claude_desktop_config.json` is correct and absolute
- Check that you've restarted Claude Desktop after updating the config
- Look for error messages in Claude Desktop's MCP logs

## Security Notes

- Never commit `credentials.json` or `credentials/token.json` to version control
- These files are automatically ignored by `.gitignore`
- OAuth2 tokens are stored locally on your machine
- The server only has permission to send emails (not read or delete)

## Development

### Run in Development Mode

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Project Structure

```
/home/user/Claude-Tools/
├── src/
│   ├── index.ts          # MCP server implementation
│   ├── gmail-client.ts   # Gmail API client wrapper
│   └── types.ts          # TypeScript type definitions
├── dist/                 # Compiled JavaScript (generated)
├── credentials/          # OAuth tokens (gitignored)
├── credentials.json      # OAuth2 credentials (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

If you encounter any issues or have questions, please check the troubleshooting section above or open an issue on GitHub.
