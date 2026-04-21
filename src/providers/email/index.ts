import { ENV } from "../../config/env";
import { EmailProvider } from "../types";
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
  async sendEmail(to, subject, html) {
    const result = await transporter.sendMail({
      from: `"Notifications" <${ENV.SMTP.USER}>`,
      to,
      subject,
      html,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  },
};
