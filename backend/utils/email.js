const nodemailer = require('nodemailer');
require('dotenv').config();

// In-memory log of sent notification emails for visibility in UI/console
const emailLogs = [];

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        },
      });
      console.log(`[Email Service] Configured live SMTP transport with host: ${process.env.SMTP_HOST}`);
      return transporter;
    } catch (err) {
      console.warn('[Email Service] Failed to initialize live SMTP, falling back to safe local mail logger:', err.message);
    }
  }

  // Fallback simulator transport when SMTP environment variables are not yet provided
  transporter = {
    sendMail: async (mailOptions) => {
      console.log(`[Email Service Notification] To: <${mailOptions.to}> | Subject: "${mailOptions.subject}"`);
      return { messageId: `mock-email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, response: 'Delivered (simulated)' };
    }
  };
  return transporter;
}

/**
 * Send an email and log it
 */
async function sendNotificationEmail({ to, subject, html, text }) {
  if (!to) {
    console.warn('[Email Service] Skipped sending email: no recipient specified.');
    return { success: false, error: 'No recipient' };
  }

  const transport = getTransporter();
  const from = process.env.EMAIL_FROM || '"RRAM Notifications" <no-reply@rram-portal.com>';

  const mailOptions = {
    from,
    to,
    subject,
    text: text || subject,
    html
  };

  try {
    const info = await transport.sendMail(mailOptions);
    const logEntry = {
      id: info.messageId || `msg-${Date.now()}`,
      to,
      subject,
      text: text || '',
      status: 'sent',
      sentAt: new Date().toISOString()
    };
    emailLogs.unshift(logEntry);
    if (emailLogs.length > 50) emailLogs.pop();

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email Service Error]:', err.message);
    emailLogs.unshift({
      id: `err-${Date.now()}`,
      to,
      subject,
      text: text || '',
      status: 'failed',
      error: err.message,
      sentAt: new Date().toISOString()
    });
    return { success: false, error: err.message };
  }
}

/**
 * Notification Email 1: New request submitted (sent to Managers & Administrators)
 */
async function sendNewRequestEmail({ approverEmail, approverName, requesterName, resourceType, quantity, purpose, requestId, appUrl }) {
  const subject = `[RRAM] New Request #${requestId}: ${quantity} x ${resourceType} by ${requesterName}`;
  const actionUrl = `${appUrl || 'http://localhost:3000'}/requests`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0b2038; padding: 24px; color: #ffffff; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
        .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 24px; }
        .field { margin-bottom: 14px; }
        .label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.05em; }
        .value { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }
        .purpose-box { background: #f1f5f9; border-radius: 8px; padding: 12px; font-size: 13px; color: #334155; line-height: 1.5; margin-top: 6px; }
        .cta { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-top: 18px; }
        .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Resource Request Submitted</h1>
          <p>RRAM · Resource Request & Approval Management</p>
        </div>
        <div class="body">
          <p style="font-size: 14px; margin-top: 0;">Hello ${approverName || 'Approver'},</p>
          <p style="font-size: 13px; color: #475569;">A new resource request has been placed and requires your review.</p>

          <div class="field">
            <div class="label">Requester</div>
            <div class="value">${requesterName}</div>
          </div>
          <div class="field">
            <div class="label">Item Requested</div>
            <div class="value">${quantity} x ${resourceType} (Request #${requestId})</div>
          </div>
          <div class="field">
            <div class="label">Purpose / Justification</div>
            <div class="purpose-box">${purpose}</div>
          </div>

          <a href="${actionUrl}" class="cta">Review & Decide in RRAM</a>
        </div>
        <div class="footer">
          This is an automated notification from RRAM System.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendNotificationEmail({
    to: approverEmail,
    subject,
    text: `New request #${requestId} for ${quantity} x ${resourceType} by ${requesterName}. Purpose: ${purpose}. Review at: ${actionUrl}`,
    html
  });
}

/**
 * Notification Email 2: Request decision made (sent to the Requester)
 */
async function sendRequestDecisionEmail({ requesterEmail, requesterName, resourceType, quantity, decision, remarks, approverName, requestId, appUrl }) {
  const isApproved = decision === 'approved';
  const isRejected = decision === 'rejected';
  const statusLabel = isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Modification Requested';
  const themeColor = isApproved ? '#16a34a' : isRejected ? '#dc2626' : '#d97706';

  const subject = `[RRAM] Request #${requestId} for ${resourceType} was ${statusLabel}`;
  const actionUrl = `${appUrl || 'http://localhost:3000'}/requests`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: ${themeColor}; padding: 24px; color: #ffffff; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
        .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 24px; }
        .field { margin-bottom: 14px; }
        .label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.05em; }
        .value { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #ffffff; background: ${themeColor}; margin-top: 4px; }
        .remarks-box { background: #f1f5f9; border-left: 3px solid ${themeColor}; border-radius: 4px; padding: 12px; font-size: 13px; color: #334155; line-height: 1.5; margin-top: 6px; }
        .cta { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-top: 18px; }
        .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Request Status Update: ${statusLabel}</h1>
          <p>RRAM · Resource Request & Approval Management</p>
        </div>
        <div class="body">
          <p style="font-size: 14px; margin-top: 0;">Hello ${requesterName || 'Staff Member'},</p>
          <p style="font-size: 13px; color: #475569;">Your resource request has been reviewed by <strong>${approverName || 'a manager'}</strong>.</p>

          <div class="field">
            <div class="label">Decision</div>
            <div class="status-badge">${statusLabel}</div>
          </div>
          <div class="field">
            <div class="label">Item & Request ID</div>
            <div class="value">${quantity || 1} x ${resourceType} (Request #${requestId})</div>
          </div>
          ${remarks ? `
          <div class="field">
            <div class="label">Approver Remarks</div>
            <div class="remarks-box">${remarks}</div>
          </div>` : ''}

          <a href="${actionUrl}" class="cta">View Request Details</a>
        </div>
        <div class="footer">
          This is an automated notification from RRAM System.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendNotificationEmail({
    to: requesterEmail,
    subject,
    text: `Your request #${requestId} for ${resourceType} was ${statusLabel} by ${approverName}. Remarks: ${remarks || 'None'}. View details: ${actionUrl}`,
    html
  });
}

/**
 * Notification Email 3: Password reset link
 */
async function sendPasswordResetEmail({ userEmail, userName, resetLink }) {
  const subject = `[RRAM] Reset Your Password`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0b2038; padding: 24px; color: #ffffff; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 700; }
        .body { padding: 24px; }
        .cta { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-top: 14px; }
        .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="body">
          <p style="font-size: 14px; margin-top: 0;">Hello ${userName || 'User'},</p>
          <p style="font-size: 13px; color: #475569;">You requested a password reset for your RRAM account. Click the button below to set a new password. This link is valid for 1 hour.</p>
          <a href="${resetLink}" class="cta">Reset Password</a>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">If you didn't request this reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          RRAM System
        </div>
      </div>
    </body>
    </html>
  `;

  return sendNotificationEmail({
    to: userEmail,
    subject,
    text: `Reset your RRAM password: ${resetLink}. Valid for 1 hour.`,
    html
  });
}

function getEmailLogs() {
  return emailLogs;
}

module.exports = {
  sendNotificationEmail,
  sendNewRequestEmail,
  sendRequestDecisionEmail,
  sendPasswordResetEmail,
  getEmailLogs
};
