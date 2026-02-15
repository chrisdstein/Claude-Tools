const { google } = require('googleapis');
const fs = require('fs');

async function sendEmail() {
  try {
    // Read credentials and token
    const credentials = JSON.parse(fs.readFileSync('credentials.json'));
    const token = JSON.parse(fs.readFileSync('credentials/token.json'));

    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Set credentials
    oauth2Client.setCredentials(token);

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email
    const to = 'chrisdstein@gmail.com';
    const subject = 'Have a Great Day!';
    const body = 'Hi Chris,\n\nJust wanted to say have a great day!\n\nBest,\nChris';

    // Create MIME message
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      body
    ].join('\r\n');

    // Encode message in base64url
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('\n✅ Email sent successfully!');
    console.log(`📧 To: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`🆔 Message ID: ${response.data.id}`);
    console.log(`🧵 Thread ID: ${response.data.threadId}\n`);

  } catch (error) {
    console.error('\n❌ Error sending email:', error.message);

    if (error.message.includes('ENOENT')) {
      console.error('\n⚠️  Missing file. Please ensure:');
      console.error('   1. credentials.json exists (from Google Cloud Console)');
      console.error('   2. credentials/token.json exists (run: node authorize.js)\n');
    } else if (error.code === 401) {
      console.error('\n⚠️  Authentication failed. Try running: node authorize.js\n');
    }
  }
}

sendEmail();
