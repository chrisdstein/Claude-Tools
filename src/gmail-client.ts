import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmailOptions, CredentialsFile, TokenInfo } from './types.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to the project root (one level up from dist)
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = path.join(PROJECT_ROOT, 'credentials', 'token.json');
const CREDENTIALS_PATH = path.join(PROJECT_ROOT, 'credentials.json');

/**
 * Gmail client for sending emails via Gmail API
 */
export class GmailClient {
  private oauth2Client: OAuth2Client | null = null;
  private gmail: any = null;

  /**
   * Initialize the Gmail client with OAuth2 authentication
   */
  async initialize(): Promise<void> {
    try {
      // Load credentials
      const credentials = await this.loadCredentials();
      const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web!;

      // Create OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      // Load or request token
      try {
        const token = await this.loadToken();
        this.oauth2Client.setCredentials(token);
      } catch (error) {
        // Token doesn't exist, need to authorize
        await this.getNewToken();
      }

      // Initialize Gmail API
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      console.error('[Gmail MCP] Gmail client initialized successfully');
    } catch (error) {
      console.error('[Gmail MCP] Failed to initialize Gmail client:', error);
      throw new Error(`Failed to initialize Gmail client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load OAuth2 credentials from credentials.json
   */
  private async loadCredentials(): Promise<CredentialsFile> {
    try {
      const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        'credentials.json not found. Please create OAuth2 credentials in Google Cloud Console and save to credentials.json'
      );
    }
  }

  /**
   * Load existing token from token.json
   */
  private async loadToken(): Promise<TokenInfo> {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Get new token through OAuth2 flow
   */
  private async getNewToken(): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.error('\n='.repeat(70));
    console.error('GMAIL MCP SERVER - FIRST TIME SETUP');
    console.error('='.repeat(70));
    console.error('\nTo authorize this application, please visit this URL:');
    console.error(`\n${authUrl}\n`);
    console.error('After authorization, you will receive a code.');
    console.error('Create credentials/token.json with the following structure:');
    console.error(JSON.stringify({
      access_token: 'YOUR_ACCESS_TOKEN',
      refresh_token: 'YOUR_REFRESH_TOKEN',
      scope: SCOPES[0],
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000
    }, null, 2));
    console.error('\n' + '='.repeat(70) + '\n');

    throw new Error('Authorization required. Please follow the instructions above.');
  }

  /**
   * Save token to token.json
   */
  private async saveToken(token: TokenInfo): Promise<void> {
    const dir = path.dirname(TOKEN_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(TOKEN_PATH, JSON.stringify(token, null, 2));
  }

  /**
   * Create a MIME message for email
   */
  private createMimeMessage(options: EmailOptions): string {
    const boundary = '----=_Part_' + Math.random().toString(36).substring(2);
    const nl = '\r\n';

    // Format recipients
    const toAddresses = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const ccAddresses = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : '';
    const bccAddresses = options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : '';

    // Build headers
    let message = [
      `To: ${toAddresses}`,
      ...(ccAddresses ? [`Cc: ${ccAddresses}`] : []),
      ...(bccAddresses ? [`Bcc: ${bccAddresses}`] : []),
      `Subject: ${options.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
    ].join(nl);

    // Add body
    const contentType = options.html ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8';
    message += nl + [
      `Content-Type: ${contentType}`,
      'Content-Transfer-Encoding: 7bit',
      '',
      options.body,
      '',
    ].join(nl);

    // Add attachments if any
    if (options.attachments && options.attachments.length > 0) {
      for (const attachment of options.attachments) {
        message += [
          `--${boundary}`,
          `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          '',
          attachment.content,
          '',
        ].join(nl);
      }
    }

    // Close message
    message += `--${boundary}--`;

    return message;
  }

  /**
   * Send an email using Gmail API
   */
  async sendEmail(options: EmailOptions): Promise<{ id: string; threadId: string }> {
    if (!this.gmail) {
      throw new Error('Gmail client not initialized. Call initialize() first.');
    }

    try {
      // Create MIME message
      const mimeMessage = this.createMimeMessage(options);

      // Encode message in base64url
      const encodedMessage = Buffer.from(mimeMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send the email
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.error(`[Gmail MCP] Email sent successfully. Message ID: ${response.data.id}`);

      return {
        id: response.data.id,
        threadId: response.data.threadId,
      };
    } catch (error: any) {
      console.error('[Gmail MCP] Failed to send email:', error);

      // Handle specific error cases
      if (error.code === 401) {
        throw new Error('Authentication failed. Please re-authorize the application.');
      } else if (error.code === 403) {
        throw new Error('Permission denied. Ensure Gmail API is enabled and scopes are correct.');
      } else if (error.code === 400) {
        throw new Error(`Invalid email format: ${error.message}`);
      }

      throw new Error(`Failed to send email: ${error.message || String(error)}`);
    }
  }
}
