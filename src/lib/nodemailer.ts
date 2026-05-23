import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'Pollstar <no-reply@pollstar.com>';

// Determine if SMTP is ready
const isSMTPConfigured = SMTP_HOST && SMTP_USER && SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (isSMTPConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Sends a 6-digit OTP verification email.
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const subject = 'Your Pollstar Verification Code';
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <h2 style="text-align: center; color: #6366f1; font-size: 28px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.05em;">Pollstar Verification</h2>
      <p style="font-size: 16px; line-height: 24px; text-align: center; color: #9ca3af; margin-bottom: 32px;">Please use the 6-digit verification code below to verify your email. This code is active for 5 minutes.</p>
      <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <span style="font-family: monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #818cf8; display: inline-block; padding-left: 12px;">${otp}</span>
      </div>
      <p style="font-size: 12px; text-align: center; color: #4b5563; margin-top: 40px;">If you did not request this verification, please ignore this email.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('SMTP Mail Error:', error);
    }
  }

  // Debug Console Fallback (Compulsory display for testing)
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Verification Code                             │`);
  console.log(`│ Code:    ${otp.padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends a Poll invitation email for closed voting.
 */
export async function sendPollInvitationEmail(
  email: string,
  pollTitle: string,
  inviteLink: string,
  description: string
): Promise<boolean> {
  const subject = `You are invited to vote in "${pollTitle}"`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px;">Poll Invitation</h2>
      <p style="font-size: 16px; line-height: 24px; color: #d1d5db; margin-bottom: 8px;">You have been invited to participate in a secure closed poll:</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <strong style="color: #f3f4f6; font-size: 18px; display: block; margin-bottom: 6px;">${pollTitle}</strong>
        <span style="color: #9ca3af; font-size: 14px;">${description}</span>
      </div>
      <p style="font-size: 16px; line-height: 24px; color: #d1d5db; margin-bottom: 24px;">Click the button below to verify your details and cast your vote:</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${inviteLink}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">Access Secure Poll</a>
      </div>
      <p style="font-size: 12px; color: #4b5563; line-height: 18px;">
        Or copy and paste this link in your browser: <br/>
        <a href="${inviteLink}" style="color: #818cf8; word-break: break-all;">${inviteLink}</a>
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('SMTP Mail Error:', error);
    }
  }

  // Debug Console Fallback
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Invitation to Vote in "${pollTitle.substring(0, 15)}..." │`);
  console.log(`│ Link:    ${inviteLink.padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}
