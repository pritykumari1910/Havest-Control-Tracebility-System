import nodemailer from 'nodemailer';
import config from '../config/config.ts';

const transport = nodemailer.createTransport(config.email.smtp);

class EmailService {
  readonly transport = transport;

  private validateEmailConfig(): void {
    const missingVars = [];

    if (!config.email.smtp.host) missingVars.push('SMTP_HOST');
    if (!config.email.smtp.port) missingVars.push('SMTP_PORT');
    if (!config.email.smtp.auth?.user) missingVars.push('SMTP_USER');
    if (!config.email.smtp.auth?.pass) missingVars.push('SMTP_PASS');
    if (!config.email.from) missingVars.push('MAIL_FROM');

    if (missingVars.length) {
      throw new Error(`Email service is not configured. Missing env vars: ${missingVars.join(', ')}`);
    }
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    this.validateEmailConfig();
    await this.transport.sendMail({ from: config.email.from, to, subject, text });
  }

  async sendWelcomeEmail(name: string, email: string, password: string): Promise<void> {
    this.validateEmailConfig();
    await this.transport.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Welcome to HCTS',
      html: `
        <h2>Welcome ${name},</h2>
        <p>Your admin account has been created successfully.</p>

        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>

        <p>Please login and change your password immediately.</p>

        <br/>
        <p>- HCTS Team</p>
      `,
    });
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    this.validateEmailConfig();
    await this.transport.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Your OTP Code - HCTS',
      html: `
        <h2>OTP Verification</h2>

        <p>Your One-Time Password (OTP) is:</p>

        <h1 style="letter-spacing: 4px;">${otp}</h1>

        <p>This OTP is valid for <strong>10 minutes</strong>.</p>

        <p>If you did not request this, please ignore this email.</p>

        <br/>
        <p>- HCTS Team</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string, expiresInMinutes: number): Promise<void> {
    this.validateEmailConfig();
    await this.transport.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Reset your HCTS password',
      html: `
        <h2>Reset your password</h2>

        <p>We received a request to reset your password. Click the button below to continue.</p>

        <p><a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px;">Reset Password</a></p>

        <p>This link is valid for <strong>${expiresInMinutes} minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>

        <br/>
        <p>HCTS Team</p>
      `,
    });
  }

  async sendContactRequestEmail(params: {
    toEmail: string;
    subject: string;
    message: string;
    nurseName: string;
    nurseEmail: string;
  }): Promise<void> {
    const { toEmail, subject, message, nurseName, nurseEmail } = params;

    this.validateEmailConfig();
    await this.transport.sendMail({
      from: config.email.from,
      to: toEmail,
      subject,
      html: `
        <h2>New Contact Request from Nurse</h2>

        <p><strong>Name:</strong> ${nurseName}</p>
        <p><strong>Email:</strong> ${nurseEmail}</p>

        <hr/>

        <div>
          ${message}
        </div>

        <br/>
        <p>- HCTS</p>
      `,
    });
  }
}

const emailService = new EmailService();

export { EmailService };

export default emailService;
