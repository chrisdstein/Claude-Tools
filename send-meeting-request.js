import { GmailClient } from './dist/gmail-client.js';

async function sendMeetingRequest() {
  console.log('🚀 Sending meeting request...\n');

  const client = new GmailClient();

  try {
    // Initialize the Gmail client
    await client.initialize();

    // Send the email
    const result = await client.sendEmail({
      to: 'chrisdstein@gmail.com',
      subject: 'Meeting Request - Monday Morning',
      body: `Hi Chris,

I hope this email finds you well!

I would like to schedule a meeting with you on Monday morning. Could you please let me know what time works best for you?

Looking forward to connecting.

Best regards,
Chris`,
      html: false
    });

    console.log('✅ Meeting request sent successfully!');
    console.log(`📧 To: chrisdstein@gmail.com`);
    console.log(`📝 Subject: Meeting Request - Monday Morning`);
    console.log(`🆔 Message ID: ${result.id}`);
    console.log(`🧵 Thread ID: ${result.threadId}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendMeetingRequest();
