// types.ts
export interface SendResult {
  success: boolean;
  messageId?: string;
}

export interface EmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

export interface EmailProvider {
  sendEmail(
    recipient: string,
    subject: string,
    html: string,
    options?: EmailOptions,
  ): Promise<SendResult>;
}