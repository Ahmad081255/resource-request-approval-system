const nodemailer = require('nodemailer');
const pool = require('../config/db');
require('dotenv').config();

// In-memory log of sent notification emails for visibility in UI/console
const emailLogs = [];

let activeConfig = null;
let transporter = null;

/**
 * Load email / SMTP configuration from DB system_settings with fallback to process.env
 */
async function loadConfig() {
  try {
    const [rows] = await pool.query(
      `SELECT setting_key, setting_value FROM system_settings 
       WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'email_from')`
    );
    const dbSettings = {};
    for (const r of rows) {
      dbSettings[r.setting_key] = r.setting_value;
    }

    const host = (dbSettings.smtp_host || process.env.SMTP_HOST || process.env.smtp_host || process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io').trim();
    const port = Number(dbSettings.smtp_port || process.env.SMTP_PORT || process.env.smtp_port || process.env.MAILTRAP_PORT) || 2525;
    const rawSecure = dbSettings.smtp_secure ?? process.env.SMTP_SECURE ?? process.env.smtp_secure;
    const secure = rawSecure !== undefined
      ? String(rawSecure).trim().toLowerCase() === 'true'
      : port === 465;
    const user = (dbSettings.smtp_user || process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.smtp_user || process.env.MAILTRAP_USER || '').trim();
    const pass = (dbSettings.smtp_pass || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.smtp_pass || process.env.MAILTRAP_PASS || '').trim();
    const from = (dbSettings.email_from || process.env.EMAIL_FROM || process.env.email_from || (user.includes('@') ? `"RRAM Notifications" <${user}>` : '"RRAM Notifications" <notifications@rram-portal.com>')).trim();

    activeConfig = { host, port, secure: port === 465 ? true : secure, user, pass, from };
    return activeConfig;
  } catch (err) {
    // If DB read fails, fall back to process.env
    const host = (process.env.SMTP_HOST || process.env.smtp_host || process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io').trim();
    const port = Number(process.env.SMTP_PORT || process.env.smtp_port || process.env.MAILTRAP_PORT) || 2525;
    const rawSecure = process.env.SMTP_SECURE ?? process.env.smtp_secure;
    const secure = rawSecure !== undefined
      ? String(rawSecure).trim().toLowerCase() === 'true'
      : port === 465;
    const user = (process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.smtp_user || process.env.MAILTRAP_USER || '').trim();
    const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.smtp_pass || process.env.MAILTRAP_PASS || '').trim();
    const from = (process.env.EMAIL_FROM || process.env.email_from || (user.includes('@') ? `"RRAM Notifications" <${user}>` : '"RRAM Notifications" <notifications@rram-portal.com>')).trim();

    activeConfig = { host, port, secure: port === 465 ? true : secure, user, pass, from };
    return activeConfig;
  }
}

/**
 * Build or retrieve current nodemailer transporter
 */
async function getTransporter(forceRefresh = false) {
  if (transporter && !forceRefresh) return transporter;

  const config = activeConfig || (await loadConfig());

  if (config.host && config.user && config.pass) {
    try {
      transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        // Mailtrap recommendation: reasonable timeouts
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      const isMailtrap = config.host.includes('mailtrap');
      console.log(`[Email Service] Configured live ${isMailtrap ? 'Mailtrap' : 'SMTP'} transport: ${config.host}:${config.port} (user: ${config.user.substring(0, 4)}***)`);
      return transporter;
    } catch (err) {
      console.warn('[Email Service] Failed to initialize SMTP transport:', err.message);
    }
  }

  // Safe fallback simulator transport when credentials are not yet entered
  transporter = {
    isSimulator: true,
    sendMail: async (mailOptions) => {
      console.log(`[Email Service Notification (Simulator)] To: <${mailOptions.to}> | Subject: "${mailOptions.subject}"`);
      return {
        messageId: `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
        response: 'Delivered to local simulation outbox (Mailtrap credentials not yet configured)'
      };
    }
  };
  return transporter;
}

/**
 * Verify an arbitrary SMTP / Mailtrap configuration
 */
async function verifyConfig({ host, port, secure, user, pass }) {
  if (!host || !user || !pass) {
    return { success: false, error: 'Host, Username, and Password are required.' };
  }

  const testTransporter = nodemailer.createTransport({
    host,
    port: Number(port) || 2525,
    secure: secure === true || secure === 'true',
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  try {
    await testTransporter.verify();
    return { success: true, message: `Connected successfully to ${host}:${port}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Save configuration to system_settings in TiDB Cloud
 */
async function saveConfig({ host, port, secure, user, pass, from }) {
  const finalHost = host || 'sandbox.smtp.mailtrap.io';
  const finalPort = String(port || 2525);
  const finalSecure = secure ? 'true' : 'false';
  const finalUser = user || '';
  const finalPass = pass !== undefined ? pass : (activeConfig ? activeConfig.pass : '');
  const finalFrom = from || '"RRAM Notifications" <notifications@rram-portal.com>';

  const settingsToUpsert = [
    ['smtp_host', finalHost],
    ['smtp_port', finalPort],
    ['smtp_secure', finalSecure],
    ['smtp_user', finalUser],
    ['email_from', finalFrom],
  ];

  if (pass) {
    settingsToUpsert.push(['smtp_pass', finalPass]);
  }

  for (const [key, value] of settingsToUpsert) {
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, value, value]
    );
  }

  // Update activeConfig and rebuild transporter
  activeConfig = {
    host: finalHost,
    port: Number(finalPort),
    secure: finalSecure === 'true',
    user: finalUser,
    pass: finalPass,
    from: finalFrom,
  };

  await getTransporter(true);

  return {
    success: true,
    message: 'Mailtrap configuration updated successfully.',
    config: getSafeConfig()
  };
}

/**
 * Returns safe config info (password never exposed)
 */
function getSafeConfig() {
  const config = activeConfig || {
    host: process.env.SMTP_HOST || process.env.smtp_host || process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
    port: Number(process.env.SMTP_PORT || process.env.smtp_port || process.env.MAILTRAP_PORT) || 2525,
    secure: String(process.env.SMTP_SECURE || process.env.smtp_secure || '').trim().toLowerCase() === 'true' || Number(process.env.SMTP_PORT || process.env.smtp_port) === 465,
    user: process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.smtp_user || process.env.MAILTRAP_USER || '',
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.smtp_pass || process.env.MAILTRAP_PASS || '',
    from: process.env.EMAIL_FROM || process.env.email_from || '"RRAM Notifications" <notifications@rram-portal.com>'
  };

  const isConfigured = Boolean(config.user && config.pass);
  const isMailtrap = (config.host || '').includes('mailtrap');

  return {
    isConfigured,
    isMailtrap,
    provider: isMailtrap ? 'Mailtrap Sandbox' : isConfigured ? 'Custom SMTP' : 'Local Simulator',
    host: config.host || 'sandbox.smtp.mailtrap.io',
    port: config.port || 2525,
    secure: Boolean(config.secure),
    user: config.user || '',
    hasPassword: Boolean(config.pass),
    maskedPassword: config.pass ? '••••••••••••' : '',
    from: config.from || '"RRAM Notifications" <notifications@rram-portal.com>'
  };
}

// Sequential queue & rate limiter for Mailtrap free plan (~10s cooldown between emails)
let sendQueue = Promise.resolve();
let lastLiveSendAt = 0;
const MAILTRAP_MIN_INTERVAL_MS = 10500;
const CUSTOM_SMTP_MIN_INTERVAL_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueueEmailTask(fn) {
  const run = sendQueue.then(fn, fn);
  sendQueue = run.catch(() => {});
  return run;
}

/**
 * Send an email and log it to outbox (with automatic Mailtrap rate-limit pacing & retry)
 */
async function sendNotificationEmail({ to, subject, html, text, eventType = 'notification' }) {
  if (!to) {
    console.warn('[Email Service] Skipped: recipient is missing.');
    return { success: false, error: 'Recipient is required' };
  }

  return enqueueEmailTask(async () => {
    const transport = await getTransporter();
    const config = activeConfig || (await loadConfig());
    const from = config.from || '"RRAM Notifications" <notifications@rram-portal.com>';
    const overrideTo = (process.env.EMAIL_OVERRIDE_TO || '').trim();
    const actualRecipient = overrideTo || to;
    const effectiveSubject = overrideTo && overrideTo !== to ? `${subject} [Intended: ${to}]` : subject;

    const mailOptions = {
      from,
      to: actualRecipient,
      subject: effectiveSubject,
      text: text || subject,
      html
    };

    const isMailtrap = (config.host || '').includes('mailtrap') && Boolean(config.user && config.pass);
    const providerLabel = isMailtrap ? 'Mailtrap Sandbox' : transport.isSimulator ? 'Local Simulation' : 'Live SMTP';
    const minIntervalMs = isMailtrap ? MAILTRAP_MIN_INTERVAL_MS : CUSTOM_SMTP_MIN_INTERVAL_MS;

    const maxAttempts = transport.isSimulator ? 1 : 4;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Pace consecutive live emails so Mailtrap free plan rate limit isn't exceeded
      if (!transport.isSimulator) {
        const elapsed = Date.now() - lastLiveSendAt;
        if (lastLiveSendAt > 0 && elapsed < minIntervalMs) {
          await sleep(minIntervalMs - elapsed);
        }
      }

      try {
        const info = await transport.sendMail(mailOptions);
        if (!transport.isSimulator) {
          lastLiveSendAt = Date.now();
        }

        const logEntry = {
          id: info.messageId || `msg-${Date.now()}`,
          to: actualRecipient,
          subject: effectiveSubject,
          eventType,
          provider: providerLabel,
          isMailtrap,
          text: text || '',
          status: 'sent',
          sentAt: new Date().toISOString()
        };
        emailLogs.unshift(logEntry);
        if (emailLogs.length > 100) emailLogs.pop();

        console.log(`[Email Service] Delivered (${providerLabel}) To: <${actualRecipient}> | Subject: "${effectiveSubject}" | ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId, provider: providerLabel };
      } catch (err) {
        lastError = err;
        if (!transport.isSimulator) {
          lastLiveSendAt = Date.now();
        }

        const isRateLimit =
          /too many emails|550 5\.7\.0|429|rate limit|try again later/i.test(err.message || '');

        if (isRateLimit && attempt < maxAttempts) {
          const backoffMs = 4000 * attempt;
          console.warn(`[Email Service] Mailtrap rate limit hit for <${to}>. Retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxAttempts})...`);
          await sleep(backoffMs);
          continue;
        }
        break;
      }
    }

    console.error(`[Email Service Error] Failed sending to ${actualRecipient}:`, lastError?.message);
    const logEntry = {
      id: `err-${Date.now()}`,
      to: actualRecipient,
      subject: effectiveSubject,
      eventType,
      provider: providerLabel,
      isMailtrap,
      text: text || '',
      status: 'failed',
      error: lastError?.message || 'Unknown SMTP error',
      sentAt: new Date().toISOString()
    };
    emailLogs.unshift(logEntry);
    return { success: false, error: lastError?.message || 'Unknown SMTP error' };
  });
}

/**
 * 1. New Request Notification (Sent to Managers and Administrators)
 */
async function sendNewRequestEmail({ approverEmail, approverName, requesterName, requesterDepartment, resourceType, quantity, purpose, requestId, appUrl }) {
  const subject = `[RRAM] New Request #${requestId}: ${quantity} x ${resourceType} by ${requesterName}`;
  const actionUrl = `${appUrl || 'http://localhost:3000'}/requests`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 28px 24px; color: #ffffff; border-bottom: 3px solid #6366f1; }
        .header .badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(99, 102, 241, 0.2); color: #818cf8; padding: 4px 10px; border-radius: 6px; margin-bottom: 8px; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
        .body { padding: 28px 24px; }
        .salutation { font-size: 15px; font-weight: 600; color: #1e293b; margin-top: 0; margin-bottom: 8px; }
        .lead { font-size: 14px; color: #475569; margin-bottom: 20px; line-height: 1.5; }
        .details-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 24px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }
        .detail-val { font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; }
        .purpose-box { background: #ffffff; border-left: 3px solid #6366f1; border-radius: 6px; padding: 12px 14px; margin-top: 14px; font-size: 13px; color: #334155; line-height: 1.5; }
        .cta-container { text-align: center; margin: 28px 0 12px 0; }
        .cta { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3); }
        .footer { padding: 18px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.4; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">Requisition Review Required</div>
          <h1>New Resource Request Submitted</h1>
          <p>RRAM · Resource Request & Approval Management System</p>
        </div>
        <div class="body">
          <p class="salutation">Hello ${approverName || 'Approver'},</p>
          <p class="lead">A new requisition has been submitted and is currently pending your review and decision.</p>

          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Request ID</span>
              <span class="detail-val">#${requestId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Requester</span>
              <span class="detail-val">${requesterName}</span>
            </div>
            ${requesterDepartment ? `
            <div class="detail-row">
              <span class="detail-label">Department</span>
              <span class="detail-val">${requesterDepartment}</span>
            </div>` : ''}
            <div class="detail-row">
              <span class="detail-label">Item / Resource</span>
              <span class="detail-val">${quantity} x ${resourceType}</span>
            </div>
            <div class="purpose-box">
              <strong style="color: #475569; display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase;">Purpose / Justification:</strong>
              ${purpose}
            </div>
          </div>

          <div class="cta-container">
            <a href="${actionUrl}" class="cta">Review & Approve in RRAM</a>
          </div>
        </div>
        <div class="footer">
          Delivered via RRAM Notification Engine.<br/>
          This is an automated system email for requisition #${requestId}.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendNotificationEmail({
    to: approverEmail,
    subject,
    eventType: 'request_submitted',
    text: `New request #${requestId} for ${quantity} x ${resourceType} submitted by ${requesterName}. Purpose: ${purpose}. Review at: ${actionUrl}`,
    html
  });
}

/**
 * 2. Request Decision Notification (Sent to the Requester for Approvals, Rejections, & Modifications)
 */
async function sendRequestDecisionEmail({ requesterEmail, requesterName, resourceType, quantity, decision, remarks, approverName, requestId, appUrl }) {
  const isApproved = decision === 'approved';
  const isRejected = decision === 'rejected';
  const isModification = decision === 'modification_requested';

  const statusTitle = isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Modification Requested';
  const themeColor = isApproved ? '#16a34a' : isRejected ? '#dc2626' : '#d97706';
  const headerBg = isApproved ? '#064e3b' : isRejected ? '#7f1d1d' : '#78350f';
  const badgeBg = isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7';
  const badgeText = isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#b45309';

  const subject = `[RRAM] Request #${requestId} for ${resourceType} was ${statusTitle.toUpperCase()}`;
  const actionUrl = `${appUrl || 'http://localhost:3000'}/requests`;

  const leadText = isApproved
    ? `Great news! Your resource requisition has been approved by <strong>${approverName || 'Management'}</strong> and is scheduled for allocation.`
    : isRejected
    ? `Your resource requisition was reviewed by <strong>${approverName || 'Management'}</strong> and could not be approved at this time.`
    : `<strong>${approverName || 'Management'}</strong> reviewed your requisition and requested adjustments before it can be processed.`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: ${headerBg}; padding: 28px 24px; color: #ffffff; border-bottom: 3px solid ${themeColor}; }
        .status-pill { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: ${badgeBg}; color: ${badgeText}; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1; }
        .body { padding: 28px 24px; }
        .salutation { font-size: 15px; font-weight: 600; color: #1e293b; margin-top: 0; margin-bottom: 8px; }
        .lead { font-size: 14px; color: #475569; margin-bottom: 20px; line-height: 1.5; }
        .details-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 24px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }
        .detail-val { font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; }
        .remarks-box { background: #ffffff; border-left: 3px solid ${themeColor}; border-radius: 6px; padding: 14px; margin-top: 14px; font-size: 13px; color: #334155; line-height: 1.5; }
        .cta-container { text-align: center; margin: 28px 0 12px 0; }
        .cta { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; }
        .footer { padding: 18px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.4; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="status-pill">${statusTitle}</div>
          <h1>Requisition Decision: ${statusTitle}</h1>
          <p>RRAM · Resource Request & Approval Management System</p>
        </div>
        <div class="body">
          <p class="salutation">Hello ${requesterName || 'Requester'},</p>
          <p class="lead">${leadText}</p>

          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Request ID</span>
              <span class="detail-val">#${requestId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Item / Resource</span>
              <span class="detail-val">${quantity || 1} x ${resourceType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Decision</span>
              <span class="detail-val" style="color: ${themeColor};">${statusTitle}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reviewed By</span>
              <span class="detail-val">${approverName || 'Manager / Administrator'}</span>
            </div>
            ${remarks ? `
            <div class="remarks-box">
              <strong style="color: #475569; display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase;">Approver Remarks / Instructions:</strong>
              ${remarks}
            </div>` : ''}
          </div>

          <div class="cta-container">
            <a href="${actionUrl}" class="cta">View Request in Portal</a>
          </div>
        </div>
        <div class="footer">
          Delivered via RRAM Notification Engine.<br/>
          This is an official decision notification for requisition #${requestId}.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendNotificationEmail({
    to: requesterEmail,
    subject,
    eventType: isApproved ? 'request_approved' : isRejected ? 'request_rejected' : 'modification_requested',
    text: `Your request #${requestId} for ${resourceType} was ${statusTitle} by ${approverName}. Remarks: ${remarks || 'None'}. Review: ${actionUrl}`,
    html
  });
}

/**
 * 3. Password Reset Email (6-Digit Verification Code)
 */
async function sendPasswordResetEmail({ userEmail, userName, code, resetLink }) {
  const subject = code
    ? `[RRAM] Your Password Reset Code: ${code}`
    : `[RRAM] Reset Your Password`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 24px; color: #ffffff; border-bottom: 3px solid #6366f1; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 700; }
        .body { padding: 24px; }
        .otp-box { background: #f1f5f9; border: 1px dashed #6366f1; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0; }
        .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #312e81; }
        .cta { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-top: 14px; }
        .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Verification Code</h1>
        </div>
        <div class="body">
          <p style="font-size: 14px; margin-top: 0;">Hello ${userName || 'User'},</p>
          ${code ? `
          <p style="font-size: 13px; color: #475569; line-height: 1.5;">
            Use the 6-digit verification code below on the RRAM Reset Password screen to set a new password. This code expires in <strong>15 minutes</strong>.
          </p>
          <div class="otp-box">
            <div class="otp-code">${code}</div>
          </div>
          ` : `
          <p style="font-size: 13px; color: #475569;">You requested a password reset for your RRAM account. Click the button below to set a new password. This link is valid for 1 hour.</p>
          <a href="${resetLink}" class="cta">Reset Password</a>
          `}
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">If you didn't request this reset, you can safely ignore this email. Never share this code with anyone.</p>
        </div>
        <div class="footer">
          RRAM System · Automated Notification Service
        </div>
      </div>
    </body>
    </html>
  `;

  return sendNotificationEmail({
    to: userEmail,
    subject,
    eventType: 'password_reset',
    text: code
      ? `Your RRAM password reset code is ${code}. Enter this code in the app within 15 minutes to set a new password.`
      : `Reset your RRAM password: ${resetLink}. Valid for 1 hour.`,
    html
  });
}

function getEmailLogs() {
  return emailLogs;
}

// Initialize on module import
loadConfig().catch(err => console.warn('[Email Service] Background config load warning:', err.message));

module.exports = {
  loadConfig,
  getTransporter,
  verifyConfig,
  saveConfig,
  getSafeConfig,
  sendNotificationEmail,
  sendNewRequestEmail,
  sendRequestDecisionEmail,
  sendPasswordResetEmail,
  getEmailLogs
};
