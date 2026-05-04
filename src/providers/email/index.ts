// emailProvider.ts
import { ENV } from "../../config/env";
import { EmailOptions, EmailProvider } from "../types";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
  host: ENV.SMTP.HOST,
  port: Number(ENV.SMTP.PORT),
  secure: false,
  auth: {
    user: ENV.SMTP.USER,
    pass: ENV.SMTP.PASS,
  },
} as SMTPTransport.Options);

export const emailProvider: EmailProvider = {
  async sendEmail(recipient, subject, html, options?: EmailOptions) {
    const result = await transporter.sendMail({
      from: `"Notifications" <${ENV.SMTP.USER}>`,
      to: options?.to?.length ? options.to : [recipient],
      cc: options?.cc ?? undefined,
      bcc: options?.bcc ?? undefined,
      replyTo: options?.replyTo ?? undefined,
      subject,
      html,

      attachments: options?.attachments?.map((file) => ({
        filename: file.filename,
        path: file.path, // local file path
        contentType: file.contentType,
      })),
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  },
};
