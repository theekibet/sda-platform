import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Configure for development (use real email service in production)
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'your-ethereal-email', // Get from https://ethereal.email
        pass: 'your-ethereal-password',
      },
    });
  }

  async sendPasswordResetEmail(to: string, token: string, name: string) {
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;
    
    const mailOptions = {
      from: '"SDA Youth Connect" <noreply@sdaconnect.com>',
      to,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">SDA Youth Connect - Safe community for young believers</p>
        </div>
      `,
    };

    return this.transporter.sendMail(mailOptions);
  }
}