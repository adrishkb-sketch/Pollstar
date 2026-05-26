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

/**
 * Sends a Vote Confirmation / Cryptographic Ballot Receipt Email.
 */
export async function sendVoteConfirmationEmail({
  email,
  pollTitle,
  voteId,
  resultsUrl,
}: {
  email: string;
  pollTitle: string;
  voteId: string;
  resultsUrl: string;
}): Promise<boolean> {
  const subject = `🗳️ Vote Cast Confirmed: "${pollTitle}"`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&bgcolor=0b0f19&color=ffffff&data=${encodeURIComponent(resultsUrl)}`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.1em;">✓ Vote Successfully Cast</span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">Ballot Receipt Secured</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px; text-align: center;">
        Your vote has been securely recorded and cryptographically sealed in the Pollstar ecosystem.
      </p>
      
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <strong style="color: #f3f4f6; font-size: 15px; display: block; margin-bottom: 4px;">Ballot Details:</strong>
        <span style="color: #9ca3af; font-size: 13px; display: block; margin-bottom: 10px;">Poll Name: <strong style="color: #ffffff">${pollTitle}</strong></span>
        <span style="color: #9ca3af; font-size: 13px; display: block;">Cryptographic Receipt Hash:</span>
        <code style="font-family: monospace; font-size: 11px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 4px 8px; color: #818cf8; display: block; margin-top: 4px; word-break: break-all;">${voteId}</code>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 12px;">Scan this QR code or click the button below to check real-time results:</p>
        <img src="${qrCodeUrl}" alt="Check Live Results QR" style="border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 16px; width: 130px; height: 130px;" />
        <br/>
        <a href="${resultsUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: inline-block;">View Live Results</a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px;">
        This is an automated security receipt. Do not reply to this message.
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
      console.error('SMTP Mail Error sending receipt:', error);
    }
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Vote Confirmation Receipt                    │`);
  console.log(`│ Hash:    ${voteId.padEnd(46)} │`);
  console.log(`│ QR Code link: ${resultsUrl.padEnd(41)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends a Poll Closed notification email.
 */
export async function sendPollClosedEmail({
  email,
  pollTitle,
  reportUrl,
}: {
  email: string;
  pollTitle: string;
  reportUrl: string;
}): Promise<boolean> {
  const subject = `📢 The Poll "${pollTitle}" is now Closed`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 0.1em;">🔒 Voting Session Closed</span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">Official Results Published</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px; text-align: center;">
        The voting window for <strong style="color: #ffffff">"${pollTitle}"</strong> has ended, and all ballots are officially locked.
      </p>

      <div style="text-align: center; margin-bottom: 24px; padding: 20px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 16px;">The electoral report has been compiled and is ready for analysis:</p>
        <a href="${reportUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);">See & Download Report</a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px;">
        Pollstar Electoral Platform. Secure, Verifiable, High-Fidelity.
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
      console.error('SMTP Mail Error sending closed notice:', error);
    }
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Poll Closed Notification                      │`);
  console.log(`│ Report:  ${reportUrl.padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends a low-priority voter gateway entry alert.
 */
export async function sendLowPriorityAccessEmail({
  email,
  pollTitle,
  pollUrl,
}: {
  email: string;
  pollTitle: string;
  pollUrl: string;
}): Promise<boolean> {
  const subject = `🗳️ Direct Access Gateway: "${pollTitle}"`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.1em;">✓ Secure Gateway Access</span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">Electoral Profile Accessed</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px; text-align: center;">
        Your voter profile has successfully logged into the ballot of <strong style="color: #ffffff">"${pollTitle}"</strong>.
      </p>
      
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 12px;">Since this session is configured as a direct gateway session, OTP verification was bypassed for your convenience.</p>
        <a href="${pollUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: inline-block;">Access Ballot</a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px;">
        If you did not initiate this login session, please contact the administrator immediately.
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
      console.error('SMTP Mail Error sending low-priority access notice:', error);
    }
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Low Priority Access Alert                     │`);
  console.log(`│ Poll:    ${pollTitle.substring(0, 30).padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends a Poll Schedule Update notification email.
 */
export async function sendPollScheduleUpdatedEmail({
  email,
  pollTitle,
  newStartTime,
  newEndTime,
  pollUrl,
}: {
  email: string;
  pollTitle: string;
  newStartTime: Date;
  newEndTime: Date;
  pollUrl: string;
}): Promise<boolean> {
  const subject = `📅 Electoral Schedule Updated: "${pollTitle}"`;
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.1em;">📅 Schedule Adjusted</span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">Voting Window Rescheduled</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px; text-align: center;">
        The administrator has updated the voting window for the poll <strong style="color: #ffffff">"${pollTitle}"</strong>.
      </p>

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <strong style="color: #f3f4f6; font-size: 14px; display: block; margin-bottom: 10px;">New Electoral Timing Details:</strong>
        <span style="color: #9ca3af; font-size: 13px; display: block; margin-bottom: 6px;">Start Time: <strong style="color: #ffffff">${formatDateTime(newStartTime)}</strong></span>
        <span style="color: #9ca3af; font-size: 13px; display: block;">End Deadline: <strong style="color: #ef4444">${formatDateTime(newEndTime)}</strong></span>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${pollUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);">Access Secure Ballot</a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px;">
        Pollstar Electoral Platform. Secure, Verifiable, High-Fidelity.
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
      console.error('SMTP Mail Error sending schedule update notice:', error);
    }
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Poll Schedule Adjusted                        │`);
  console.log(`│ Start:   ${formatDateTime(newStartTime).padEnd(46)} │`);
  console.log(`│ End:     ${formatDateTime(newEndTime).padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}
