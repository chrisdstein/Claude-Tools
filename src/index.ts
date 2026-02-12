#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { GmailClient } from './gmail-client.js';
import { EmailOptions } from './types.js';

// Schema for send_email tool input
const SendEmailSchema = z.object({
  to: z.union([z.string(), z.array(z.string())]).describe('Recipient email address(es)'),
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Email body content'),
  cc: z.union([z.string(), z.array(z.string())]).optional().describe('CC recipient email address(es)'),
  bcc: z.union([z.string(), z.array(z.string())]).optional().describe('BCC recipient email address(es)'),
  html: z.boolean().optional().describe('Whether the body is HTML (default: false)'),
  attachments: z.array(z.object({
    filename: z.string().describe('Name of the attachment file'),
    content: z.string().describe('Base64 encoded file content'),
    mimeType: z.string().describe('MIME type of the file (e.g., application/pdf, image/png)'),
  })).optional().describe('Email attachments'),
});

/**
 * Gmail MCP Server
 * Provides email sending capabilities via Gmail API
 */
class GmailMCPServer {
  private server: Server;
  private gmailClient: GmailClient;

  constructor() {
    this.server = new Server(
      {
        name: 'gmail-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.gmailClient = new GmailClient();

    // Register handlers
    this.setupHandlers();

    // Error handling
    this.server.onerror = (error) => {
      console.error('[Gmail MCP] Server error:', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Setup MCP server request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'send_email',
            description: 'Send an email via Gmail. Supports plain text and HTML emails, multiple recipients, CC, BCC, and attachments.',
            inputSchema: {
              type: 'object',
              properties: {
                to: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } }
                  ],
                  description: 'Recipient email address(es). Can be a single email or array of emails.',
                },
                subject: {
                  type: 'string',
                  description: 'Email subject line',
                },
                body: {
                  type: 'string',
                  description: 'Email body content (plain text or HTML)',
                },
                cc: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } }
                  ],
                  description: 'CC recipient email address(es)',
                },
                bcc: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } }
                  ],
                  description: 'BCC recipient email address(es)',
                },
                html: {
                  type: 'boolean',
                  description: 'Set to true if body contains HTML (default: false)',
                },
                attachments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      filename: { type: 'string' },
                      content: { type: 'string', description: 'Base64 encoded content' },
                      mimeType: { type: 'string', description: 'MIME type (e.g., application/pdf)' },
                    },
                    required: ['filename', 'content', 'mimeType'],
                  },
                  description: 'Email attachments',
                },
              },
              required: ['to', 'subject', 'body'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'send_email') {
        try {
          // Validate input
          const args = SendEmailSchema.parse(request.params.arguments);

          // Send email
          const result = await this.gmailClient.sendEmail(args as EmailOptions);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  messageId: result.id,
                  threadId: result.threadId,
                  message: 'Email sent successfully',
                }, null, 2),
              },
            ],
          };
        } catch (error: any) {
          // Return error in a user-friendly format
          const errorMessage = error instanceof Error ? error.message : String(error);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: errorMessage,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  /**
   * Initialize and start the server
   */
  async start(): Promise<void> {
    try {
      // Initialize Gmail client
      console.error('[Gmail MCP] Initializing Gmail client...');
      await this.gmailClient.initialize();
      console.error('[Gmail MCP] Gmail client ready');

      // Start MCP server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('[Gmail MCP] Server started and listening on stdio');
    } catch (error) {
      console.error('[Gmail MCP] Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new GmailMCPServer();
server.start().catch((error) => {
  console.error('[Gmail MCP] Fatal error:', error);
  process.exit(1);
});
