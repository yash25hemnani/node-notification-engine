export interface SendResult {
  success: boolean;
  messageId?: string;
}

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string): Promise<SendResult>;
}
