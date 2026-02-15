const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

// Read credentials
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Generate authorization URL
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('\n==================================================');
console.log('Gmail MCP Server - Authorization');
console.log('==================================================\n');
console.log('Step 1: Visit this URL in your browser:\n');
console.log(authUrl);
console.log('\n==================================================\n');
console.log('Step 2: Sign in with your Gmail account');
console.log('Step 3: Grant the requested permissions');
console.log('Step 4: Copy the authorization code from the browser\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Paste the authorization code here: ', (code) => {
  rl.close();

  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('\n❌ Error retrieving access token:', err.message);
      return;
    }

    // Create credentials directory if it doesn't exist
    if (!fs.existsSync('credentials')) {
      fs.mkdirSync('credentials');
    }

    // Save token
    fs.writeFileSync('credentials/token.json', JSON.stringify(token, null, 2));

    console.log('\n✅ Authorization successful!');
    console.log('✅ Token saved to: credentials/token.json');
    console.log('\nYou can now use the Gmail MCP server with Claude Desktop!');
    console.log('\nNext steps:');
    console.log('1. Make sure claude_desktop_config.json is configured');
    console.log('2. Restart Claude Desktop');
    console.log('3. Try sending an email!\n');
  });
});
