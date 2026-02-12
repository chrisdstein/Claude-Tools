/**
 * Type definitions for Gmail MCP Server
 */

/**
 * Email attachment interface
 */
export interface Attachment {
  filename: string;
  content: string; // Base64 encoded content
  mimeType: string;
}

/**
 * Options for sending an email
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string | string[];
  bcc?: string | string[];
  html?: boolean;
  attachments?: Attachment[];
}

/**
 * OAuth2 credentials structure
 */
export interface OAuth2Credentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

/**
 * Credentials file structure
 */
export interface CredentialsFile {
  installed?: OAuth2Credentials;
  web?: OAuth2Credentials;
}

/**
 * Token information stored after OAuth
 */
export interface TokenInfo {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}
