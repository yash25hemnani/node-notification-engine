// types.ts

export interface SendResult {
  success: boolean;
  messageId?: string;
}

export interface EmailAttachment {
  filename: string;
  path?: string;          // Local file path
  content?: Buffer;       // Direct file buffer
  contentType?: string;   // MIME type
}

export interface EmailOptions {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailProvider {
  sendEmail(
    recipient: string,
    subject: string,
    html: string,
    options?: EmailOptions,
  ): Promise<SendResult>;
}