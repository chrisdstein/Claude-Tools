import { GmailClient } from './dist/gmail-client.js';

async function sendTestEmail() {
  console.log('🚀 Starting email send...\n');

  const client = new GmailClient();

  try {
    // Initialize the Gmail client
    await client.initialize();

    // Send the email
    const result = await client.sendEmail({
      to: 'chrisdstein@gmail.com',
      subject: 'Have a Great Day!',
      body: 'Hi Chris,\n\nJust wanted to say have a great day!\n\nBest,\nChris',
      html: false
    });

    console.log('✅ Email sent successfully!');
    console.log(`📧 To: chrisdstein@gmail.com`);
    console.log(`📝 Subject: Have a Great Day!`);
    console.log(`🆔 Message ID: ${result.id}`);
    console.log(`🧵 Thread ID: ${result.threadId}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendTestEmail();
