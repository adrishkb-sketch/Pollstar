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
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Sends a 6-digit OTP verification email.
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const subject = 'Your Pollstar Verification Code';
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <h2 style="text-align: center; color: #6366f1; font-size: 28px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.05em;">Pollstar Verification</h2>
      <p style="font-size: 16px; line-height: 24px; text-align: center; color: #9ca3af; margin-bottom: 32px;">Please use the 6-digit verification code below to verify your email. This code is active for 5 minutes.</p>
      <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 16px; padding: 20px 12px; text-align: center; margin-bottom: 32px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #818cf8; display: inline-block; padding-left: 8px;">${otp}</span>
      </div>
      <p style="font-size: 12px; text-align: center; color: #4b5563; margin-top: 40px;">If you did not request this verification, please ignore this email.</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
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
  description: string,
  pollType?: string
): Promise<boolean> {
  const isExam = pollType === 'EXAM';
  const isSurvey = pollType === 'SURVEY';
  const typeLabel = isExam ? 'Exam' : (isSurvey ? 'Survey' : 'Poll');
  const actionLabel = isExam ? 'Start Exam' : (isSurvey ? 'Begin Survey' : 'Cast Vote');
  const accessLabel = isExam ? 'Access Secure Exam' : (isSurvey ? 'Access Secure Survey' : 'Access Secure Poll');

  const subject = isExam 
    ? `You are invited to take the Exam "${pollTitle}"` 
    : (isSurvey 
        ? `You are invited to participate in the Survey "${pollTitle}"`
        : `You are invited to vote in "${pollTitle}"`);

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px;">${typeLabel} Invitation</h2>
      <p style="font-size: 16px; line-height: 24px; color: #d1d5db; margin-bottom: 8px;">You have been invited to participate in a secure closed ${typeLabel.toLowerCase()}:</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <strong style="color: #f3f4f6; font-size: 18px; display: block; margin-bottom: 6px;">${pollTitle}</strong>
        <span style="color: #9ca3af; font-size: 14px;">${description}</span>
      </div>
      <p style="font-size: 16px; line-height: 24px; color: #d1d5db; margin-bottom: 24px;">Click the button below to verify your details and ${actionLabel.toLowerCase()}:</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${inviteLink}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">${accessLabel}</a>
      </div>
      <p style="font-size: 12px; color: #4b5563; line-height: 18px;">
        Or copy and paste this link in your browser: <br/>
        <a href="${inviteLink}" style="color: #818cf8; word-break: break-all;">${inviteLink}</a>
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
  }

  // Debug Console Fallback
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Invitation to ${actionLabel} in "${pollTitle.substring(0, 15)}..." │`);
  console.log(`│ Link:    ${inviteLink.padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends a Submission Confirmation email — adapts language for polls, surveys, and exams.
 */
export async function sendVoteConfirmationEmail({
  email,
  pollTitle,
  voteId,
  resultsUrl,
  pollType,
}: {
  email: string;
  pollTitle: string;
  voteId: string;
  resultsUrl: string;
  pollType?: string;
}): Promise<boolean> {
  const isSurvey = pollType === 'SURVEY';
  const subject = isSurvey
    ? `✅ Survey Response Confirmed: "${pollTitle}"`
    : `🗳️ Vote Cast Confirmed: "${pollTitle}"`;
  const badgeText = isSurvey ? '✓ Survey Response Recorded' : '✓ Vote Successfully Cast';
  const headingText = isSurvey ? 'Response Securely Recorded' : 'Ballot Receipt Secured';
  const bodyText = isSurvey
    ? 'Your survey responses have been securely recorded in the Pollstar ecosystem.'
    : 'Your vote has been securely recorded and cryptographically sealed in the Pollstar ecosystem.';
  const detailsLabel = isSurvey ? 'Response Details:' : 'Ballot Details:';
  const idLabel = isSurvey ? 'Response Cryptographic ID:' : 'Cryptographic Receipt Hash:';
  const resultsLabel = isSurvey ? 'View Survey Results' : 'View Live Results';
  const resultsCaption = isSurvey
    ? 'Scan the QR code or click the button below to view the survey report:'
    : 'Scan this QR code or click the button below to check real-time results:';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&bgcolor=0b0f19&color=ffffff&data=${encodeURIComponent(resultsUrl)}`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.1em;">${badgeText}</span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">${headingText}</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px; text-align: center;">
        ${bodyText}
      </p>
      
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <strong style="color: #f3f4f6; font-size: 15px; display: block; margin-bottom: 4px;">${detailsLabel}</strong>
        <span style="color: #9ca3af; font-size: 13px; display: block; margin-bottom: 10px;">${isSurvey ? 'Survey' : 'Poll'} Name: <strong style="color: #ffffff">${pollTitle}</strong></span>
        <span style="color: #9ca3af; font-size: 13px; display: block;">${idLabel}</span>
        <code style="font-family: monospace; font-size: 11px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 4px 8px; color: #818cf8; display: block; margin-top: 4px; word-break: break-all;">${voteId}</code>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 12px;">${resultsCaption}</p>
        <img src="${qrCodeUrl}" alt="Check Results QR" style="border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 16px; width: 130px; height: 130px;" />
        <br/>
        <a href="${resultsUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: inline-block;">${resultsLabel}</a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px;">
        This is an automated security receipt. Do not reply to this message.
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: ${isSurvey ? 'Survey Response Confirmed' : 'Vote Confirmation Receipt'} │`);
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
  pollType,
}: {
  email: string;
  pollTitle: string;
  reportUrl: string;
  pollType?: string;
}): Promise<boolean> {
  const isExam = pollType === 'EXAM';
  const isSurvey = pollType === 'SURVEY';
  const typeLabel = isExam ? 'Exam' : (isSurvey ? 'Survey' : 'Poll');
  
  const subject = isExam 
    ? `📢 The Exam "${pollTitle}" has concluded` 
    : (isSurvey 
        ? `📢 The Survey "${pollTitle}" is now Closed`
        : `📢 The Poll "${pollTitle}" is now Closed`);

  const statusBadge = isExam 
    ? '🔒 Exam Session Concluded' 
    : (isSurvey ? '🔒 Survey Session Closed' : '🔒 Voting Session Closed');

  const titleText = isExam ? 'Exam Grades Prepared' : 'Official Results Published';

  const descText = isExam 
    ? `The response window for the exam <strong style="color: #ffffff">"${pollTitle}"</strong> has concluded. The evaluation pipeline is now active.` 
    : (isSurvey 
        ? `The participation window for <strong style="color: #ffffff">"${pollTitle}"</strong> has ended.`
        : `The voting window for <strong style="color: #ffffff">"${pollTitle}"</strong> has ended, and all ballots are officially locked.`);

  const reportDesc = isExam 
    ? 'Your diagnostic scorecard and performance feedback are ready:' 
    : 'The official report has been compiled and is ready for analysis:';

  const footerText = isExam 
    ? 'Pollstar Assessment Platform. Secure, Verifiable, High-Fidelity.' 
    : 'Pollstar Electoral Platform. Secure, Verifiable, High-Fidelity.';

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 0.1em;">${statusBadge}</span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">${titleText}</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px; text-align: center;">
        ${descText}
      </p>

      <div style="text-align: center; margin-bottom: 24px; padding: 20px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 16px;">${reportDesc}</p>
        <a href="${reportUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);">See & Download Report</a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px;">
        ${footerText}
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
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
 * Sends a low-priority access alert — adapts language for surveys, exams, and polls.
 */
export async function sendLowPriorityAccessEmail({
  email,
  pollTitle,
  pollUrl,
  pollType,
}: {
  email: string;
  pollTitle: string;
  pollUrl: string;
  pollType?: string;
}): Promise<boolean> {
  const isSurvey = pollType === 'SURVEY';
  const isExam = pollType === 'EXAM';
  const typeLabel = isExam ? 'Exam' : (isSurvey ? 'Survey' : 'Poll');
  const subject = isSurvey
    ? `📋 Survey Access Confirmed: "${pollTitle}"`
    : (isExam ? `📝 Exam Access Confirmed: "${pollTitle}"` : `🗳️ Direct Access Gateway: "${pollTitle}"`);
  const headingText = isExam ? 'Exam Session Accessed' : (isSurvey ? 'Survey Session Accessed' : 'Electoral Profile Accessed');
  const bodyText = isExam
    ? `Your profile has been verified for the exam <strong style="color: #ffffff">"${pollTitle}"</strong>.`
    : (isSurvey
      ? `Your profile has been verified for the survey <strong style="color: #ffffff">"${pollTitle}"</strong>.`
      : `Your voter profile has successfully logged into the ballot of <strong style="color: #ffffff">"${pollTitle}"</strong>.`);
  const buttonText = isExam ? 'Begin Exam' : (isSurvey ? 'Begin Survey' : 'Access Ballot');
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.1em;">✓ Secure Gateway Access</span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">${headingText}</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px; text-align: center;">
        ${bodyText}
      </p>
      
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 12px;">Since this session is configured as a direct gateway session, OTP verification was bypassed for your convenience.</p>
        <a href="${pollUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: inline-block;">${buttonText}</a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px;">
        If you did not initiate this login session, please contact the administrator immediately.
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: ${typeLabel} Direct Access Alert              │`);
  console.log(`│ ${typeLabel}:    ${pollTitle.substring(0, 30).padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends a Poll/Survey/Exam Schedule Update notification email.
 */
export async function sendPollScheduleUpdatedEmail({
  email,
  pollTitle,
  newStartTime,
  newEndTime,
  pollUrl,
  pollType,
}: {
  email: string;
  pollTitle: string;
  newStartTime: Date;
  newEndTime: Date;
  pollUrl: string;
  pollType?: string;
}): Promise<boolean> {
  const isSurvey = pollType === 'SURVEY';
  const isExam = pollType === 'EXAM';
  const typeLabel = isExam ? 'Exam' : (isSurvey ? 'Survey' : 'Poll');
  const subject = isSurvey
    ? `📅 Survey Schedule Updated: "${pollTitle}"`
    : (isExam ? `📅 Exam Schedule Updated: "${pollTitle}"` : `📅 Electoral Schedule Updated: "${pollTitle}"`);
  const headingText = isExam ? 'Exam Timing Updated' : (isSurvey ? 'Survey Window Updated' : 'Voting Window Rescheduled');
  const bodyText = isExam
    ? `The administrator has updated the schedule for the exam <strong style="color: #ffffff">"${pollTitle}"</strong>.`
    : (isSurvey
      ? `The administrator has updated the participation window for the survey <strong style="color: #ffffff">"${pollTitle}"</strong>.`
      : `The administrator has updated the voting window for the poll <strong style="color: #ffffff">"${pollTitle}"</strong>.`);
  const timingLabel = isExam ? 'Updated Exam Schedule:' : (isSurvey ? 'Updated Survey Window:' : 'New Electoral Timing Details:');
  const buttonText = isExam ? 'Access Exam' : (isSurvey ? 'Access Survey' : 'Access Secure Ballot');
  const footerText = isExam
    ? 'Pollstar Assessment Platform. Secure, Verifiable, High-Fidelity.'
    : (isSurvey ? 'Pollstar Survey Platform. Secure, Verifiable, High-Fidelity.' : 'Pollstar Electoral Platform. Secure, Verifiable, High-Fidelity.');
  const formatDateTime = (date: Date) =>
    date.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', timeZoneName: 'short',
    });

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.1em;">📅 Schedule Adjusted</span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">${headingText}</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px; text-align: center;">
        ${bodyText}
      </p>

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <strong style="color: #f3f4f6; font-size: 14px; display: block; margin-bottom: 10px;">${timingLabel}</strong>
        <span style="color: #9ca3af; font-size: 13px; display: block; margin-bottom: 6px;">Start Time: <strong style="color: #ffffff">${formatDateTime(newStartTime)}</strong></span>
        <span style="color: #9ca3af; font-size: 13px; display: block;">End Deadline: <strong style="color: #ef4444">${formatDateTime(newEndTime)}</strong></span>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${pollUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);">${buttonText}</a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px;">
        ${footerText}
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({ from: SMTP_FROM, to: email, subject, html });
    return true;
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: ${typeLabel} Schedule Adjusted                │`);
  console.log(`│ Start:   ${formatDateTime(newStartTime).padEnd(46)} │`);
  console.log(`│ End:     ${formatDateTime(newEndTime).padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends an email notification to a creator confirming that their account has been approved and verified by the admin.
 */
export async function sendCreatorApprovalEmail(email: string): Promise<boolean> {
  const subject = 'Your Pollstar Creator Account is Approved!';
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 16px; padding: 14px; display: inline-block; color: #10b981;">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
      </div>
      <h2 style="color: #10b981; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">Creator Account Verified!</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 24px; text-align: center;">
        Congratulations! Your creator status on the Pollstar platform has been verified and approved by the system administrator.
      </p>

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <span style="color: #9ca3af; font-size: 14px; display: block; margin-bottom: 4px;">You can now log in and build:</span>
        <strong style="color: #ffffff; font-size: 16px;">Secure, High-Priority OTP Polls, Ranked Priorities, and Bracket Tournaments!</strong>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="http://localhost:3000/dashboard" style="background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">Create a Poll Now</a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px; margin-top: 32px;">
        Pollstar Electoral Platform. Secure, Verifiable, High-Fidelity.
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
  }

  // Fallback sandbox logs
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Creator Account Approved & Verified           │`);
  console.log(`│ Status:  READY TO CREATE POLLS                         │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends an email notification to a collaborator.
 */
export async function sendPollCollaboratorInvitationEmail(
  email: string,
  pollTitle: string,
  inviteLink: string,
  isRegistered: boolean
): Promise<boolean> {
  const subject = `🤝 You are invited to collaborate on "${pollTitle}"`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px;">Poll Collaboration Invite</h2>
      <p style="font-size: 16px; line-height: 24px; color: #d1d5db; margin-bottom: 8px;">You have been invited to collaborate on the poll/survey:</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <strong style="color: #f3f4f6; font-size: 18px; display: block;">${pollTitle}</strong>
      </div>
      <p style="font-size: 16px; line-height: 24px; color: #d1d5db; margin-bottom: 24px;">
        ${isRegistered 
          ? 'Since you already have a Pollstar account, this poll is now active on your dashboard!'
          : 'To start collaborating, please click the button below to register a Pollstar account:'}
      </p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${inviteLink}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
          ${isRegistered ? 'Access Dashboard' : 'Register & Access'}
        </a>
      </div>
      <p style="font-size: 12px; color: #4b5563; line-height: 18px;">
        Or copy and paste this link in your browser: <br/>
        <a href="${inviteLink}" style="color: #818cf8; word-break: break-all;">${inviteLink}</a>
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
  }

  // Debug Console Fallback
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Collab Invitation to "${pollTitle.substring(0, 15)}..." │`);
  console.log(`│ Link:    ${inviteLink.padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends a notification to students when exam results are released, with marks, comments, and tutoring link.
 */
export async function sendExamResultsReleasedEmail({
  email,
  pollTitle,
  scoreEarned,
  scoreTotal,
  analysisUrl,
}: {
  email: string;
  pollTitle: string;
  scoreEarned: number;
  scoreTotal: number;
  analysisUrl: string;
}): Promise<boolean> {
  const subject = `📝 Exam Results Released: "${pollTitle}"`;
  const percentage = scoreTotal > 0 ? Math.round((scoreEarned / scoreTotal) * 100) : 0;
  const passed = percentage >= 40;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: ${passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border: 1px solid ${passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: ${passed ? '#10b981' : '#ef4444'}; text-transform: uppercase; letter-spacing: 0.1em;">
          📝 Score Report Released
        </span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">Your Exam Score is Ready</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px; text-align: center;">
        The results for the examination <strong style="color: #ffffff">"${pollTitle}"</strong> have been officially released.
      </p>

      <div style="text-align: center; margin-bottom: 24px; padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02);">
        <span style="font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">Your Final Score</span>
        <span style="font-size: 48px; font-weight: 900; color: ${passed ? '#10b981' : '#ef4444'}; display: block; margin-bottom: 4px; font-family: monospace;">${scoreEarned} / ${scoreTotal}</span>
        <span style="font-size: 14px; color: #9ca3af; display: block; font-weight: 600;">Grade Percentage: ${percentage}%</span>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 16px;">
          For a detailed concept-by-concept analysis, personalized AI tutoring explanations, and tips on where improvements are needed:
        </p>
        <a href="${analysisUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);">
          Open Detailed Concept Analysis
        </a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px; margin-top: 32px;">
        Pollstar Online Testing Engine. Personal Tutoring, Precise Diagnostics.
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Exam Results Released                         │`);
  console.log(`│ Score:   ${(scoreEarned + ' / ' + scoreTotal).padEnd(46)} │`);
  console.log(`│ Link:    ${analysisUrl.padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends a secure exam submission confirmation receipt email.
 */
export async function sendExamSubmissionConfirmationEmail({
  email,
  examTitle,
  submissionId,
  resultsUrl,
  resultsReleased,
}: {
  email: string;
  examTitle: string;
  submissionId: string;
  resultsUrl: string;
  resultsReleased: boolean;
}): Promise<boolean> {
  const subject = `📝 Exam Submitted: "${examTitle}"`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.1em;">✓ Exam Submitted Successfully</span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">Submission Securely Received</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px; text-align: center;">
        Your answer papers for the examination <strong style="color: #ffffff">"${examTitle}"</strong> have been securely received and recorded.
      </p>
      
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <strong style="color: #f3f4f6; font-size: 15px; display: block; margin-bottom: 4px;">Receipt Details:</strong>
        <span style="color: #9ca3af; font-size: 13px; display: block; margin-bottom: 10px;">Exam Name: <strong style="color: #ffffff">${examTitle}</strong></span>
        <span style="color: #9ca3af; font-size: 13px; display: block;">Submission Cryptographic ID:</span>
        <code style="font-family: monospace; font-size: 11px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 4px 8px; color: #818cf8; display: block; margin-top: 4px; word-break: break-all;">${submissionId}</code>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        ${resultsReleased ? `
          <p style="font-size: 13px; color: #9ca3af; margin-bottom: 16px;">Immediate Results Release is enabled! Click below to view your graded scorecard and AI Concept Tutor diagnostics:</p>
          <a href="${resultsUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: inline-block;">View Graded Results & Diagnostics</a>
        ` : `
          <p style="font-size: 13px; color: #9ca3af; margin-bottom: 12px;">Results are currently withheld by the examiner. You will receive an automated email notice containing your score breakdown as soon as grades are officially released.</p>
        `}
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px; margin-top: 32px;">
        Pollstar Online Testing Engine. Personal Tutoring, Precise Diagnostics.
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Exam Submission Secured                      │`);
  console.log(`│ Hash:    ${submissionId.padEnd(46)} │`);
  console.log(`│ Status:  ${(resultsReleased ? 'Immediate Score Available' : 'Withheld').padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends a highly polished, printable digital report card email to the candidate upon final report publication.
 */
export async function sendFinalGradedReportCardEmail({
  email,
  examTitle,
  scoreEarned,
  scoreTotal,
  analysisUrl,
  feedbackSummary,
}: {
  email: string;
  examTitle: string;
  scoreEarned: number;
  scoreTotal: number;
  analysisUrl: string;
  feedbackSummary?: string;
}): Promise<boolean> {
  const subject = `🎓 Official Final Report Card: "${examTitle}"`;
  const percentage = scoreTotal > 0 ? Math.round((scoreEarned / scoreTotal) * 100) : 0;
  const passed = percentage >= 40;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 6px 16px; font-size: 11px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.1em;">🎓 Official Final Grade Released</span>
      </div>
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">Official Examination Report Card</h2>
      <p style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 24px; text-align: center;">
        Your instructor has finalized all manual grading and published the official grades for the exam <strong style="color: #ffffff">"${examTitle}"</strong>.
      </p>

      <div style="text-align: center; margin-bottom: 24px; padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02);">
        <span style="font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">Your Official Grade</span>
        <span style="font-size: 48px; font-weight: 900; color: ${passed ? '#10b981' : '#ef4444'}; display: block; margin-bottom: 4px; font-family: monospace;">${scoreEarned} / ${scoreTotal}</span>
        <span style="font-size: 14px; color: #9ca3af; display: block; font-weight: 600;">Final Percentage: ${percentage}%</span>
      </div>

      ${feedbackSummary ? `
        <div style="background: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); padding: 16px; margin-bottom: 24px;">
          <strong style="color: #ffffff; font-size: 13px; display: block; margin-bottom: 6px;">Examiner's Remarks & Feedback:</strong>
          <p style="color: #d1d5db; font-size: 13px; margin: 0; line-height: 20px;">${feedbackSummary}</p>
        </div>
      ` : ''}

      <div style="text-align: center; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 16px;">
          Click the link below to view your interactive diagnostic report, check question comparisons with peer performance, review detailed explanations, and download your printable PDF report card:
        </p>
        <a href="${analysisUrl}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
          View Final Report & Download PDF
        </a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px; margin-top: 32px;">
        Pollstar Online Testing Engine. Personal Tutoring, Precise Diagnostics.
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Final Graded Report Card Released             │`);
  console.log(`│ Score:   ${(scoreEarned + ' / ' + scoreTotal).padEnd(46)} │`);
  console.log(`│ Link:    ${analysisUrl.padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends a newsletter broadcast to subscribers.
 */
export async function sendNewsletterBroadcastEmail(email: string, title: string, content: string): Promise<boolean> {
  const subject = `📢 Newsletter: ${title}`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 24px; text-align: center;">Pollstar News & Updates</h2>
      <div style="font-size: 15px; line-height: 24px; color: #d1d5db; margin-bottom: 20px;">
        ${content.replace(/\n/g, '<br />')}
      </div>
      <p style="font-size: 11px; text-align: center; color: #4b5563; line-height: 16px; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px;">
        You are receiving this because you subscribed to the Pollstar newsletter loop.
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
  }

  // Fallback sandbox
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: ${subject.substring(0, 45).padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

/**
 * Sends an email notification to reset user account password.
 */
export async function sendResetPasswordEmail(email: string, otp: string): Promise<boolean> {
  const subject = 'Reset Your Pollstar Password';
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0b0f19; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f3f4f6;">
      <h2 style="text-align: center; color: #ef4444; font-size: 24px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.05em;">Reset Password Request</h2>
      <p style="font-size: 15px; line-height: 24px; text-align: center; color: #9ca3af; margin-bottom: 32px;">Please use the 6-digit verification code below to reset your Pollstar account password. This code is active for 5 minutes.</p>
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 16px; padding: 20px 12px; text-align: center; margin-bottom: 32px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f87171; display: inline-block; padding-left: 8px;">${otp}</span>
      </div>
      <p style="font-size: 12px; text-align: center; color: #4b5563; margin-top: 40px;">If you did not request a password reset, please ignore this email and verify your security settings.</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html,
    });
    return true;
  }

  // Debug Console Fallback
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log(`│               📬 POLLSTAR EMAIL SANDBOX               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ To:      ${email.padEnd(46)} │`);
  console.log(`│ Subject: Reset Password Request                        │`);
  console.log(`│ Code:    ${otp.padEnd(46)} │`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  return true;
}

