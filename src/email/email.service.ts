import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpServer = this.configService.get<string>('smtp.server');
    const smtpUser = this.configService.get<string>('smtp.user');
    const smtpPassword = this.configService.get<string>('smtp.password');

    if (!smtpServer) {
      this.logger.warn(
        'SMTP server not configured. Email sending will be disabled.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpServer,
      auth:
        smtpUser && smtpPassword
          ? {
              user: smtpUser,
              pass: smtpPassword,
            }
          : undefined,
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        'Email sending is disabled due to missing SMTP configuration',
      );
      return false;
    }

    try {
      const from = this.configService.get<string>('smtp.from');
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to send email: ${err.message}`, err.stack);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;

    return this.sendEmail(to, 'Password Reset Request', html);
  }

  async sendEmailVerification(to: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const html = `
      <h1>Email Verification</h1>
      <p>Thank you for registering. Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>If you didn't create an account, please ignore this email.</p>
    `;

    return this.sendEmail(to, 'Email Verification', html);
  }
}
