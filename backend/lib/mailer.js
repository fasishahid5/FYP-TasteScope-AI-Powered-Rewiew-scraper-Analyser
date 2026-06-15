const nodemailer = require('nodemailer');

const BRAND_NAME = 'TasteScope';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@tastescope.example';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const buildEmailTemplate = ({
  title,
  intro,
  contentHtml,
  buttonText,
  buttonUrl,
  accentColor = '#2563eb',
}) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;color:#111827;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:24px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.12);">
            <tr>
              <td style="background:${accentColor};padding:28px 32px;text-align:center;color:#ffffff;">
                <h1 style="margin:0;font-size:26px;letter-spacing:0.02em;">${BRAND_NAME}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 24px;">
                <h2 style="margin:0 0 18px;font-size:22px;font-weight:700;color:#0f172a;">${title}</h2>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#475569;">${intro}</p>
                <div style="font-size:15px;line-height:1.8;color:#475569;">${contentHtml}</div>
                
                <!-- 🎯 Solid teal/green background HTML button exactly matching your screenshot configuration -->
                ${buttonUrl ? `<div style="margin-top:28px;text-align:left;"><a href="${buttonUrl}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:${accentColor};color:#ffffff;text-decoration:none;font-weight:700;">${buttonText}</a></div>` : ''}
                
                <p style="margin:32px 0 0;font-size:13px;line-height:1.7;color:#94a3b8;">If you did not request this, please contact security support immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:${accentColor};text-decoration:none;">${SUPPORT_EMAIL}</a>.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:18px 32px;text-align:center;font-size:12px;color:#94a3b8;">
                <span>${BRAND_NAME} • Intelligent restaurant review intelligence in one place</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const safeDeviceDetails = (deviceDetails) => {
  if (!deviceDetails) return 'Unknown device';
  if (typeof deviceDetails === 'string') return deviceDetails;
  const browser = deviceDetails.browser || deviceDetails.client || 'Unknown browser';
  const platform = deviceDetails.platform || deviceDetails.os || 'Unknown platform';
  return `${browser} on ${platform}`;
};

const shouldSendEmail = (user) => {
  if (!user) return false;
  if (user.preferences && user.preferences.emailNotificationsEnabled === false) {
    return false;
  }
  return true;
};

const sendPasswordChangedEmail = async (user, userEmail, userName) => {
  if (!shouldSendEmail(user)) return null;
  if (!userEmail) return null;

  const displayName = String(userName || user?.name || 'there').trim();
  const subject = 'Your TasteScope password was updated';
  const html = buildEmailTemplate({
    title: 'Password Updated Successfully',
    intro: `Hi ${displayName}, your password was successfully updated. If you did not make this change, please contact security support immediately.`,
    contentHtml: `<p style="margin:0 0 0;">We wanted to let you know that your TasteScope account password has been changed. If this change was not made by you, our security team is ready to help.</p>`,
    accentColor: '#1d4ed8',
  });

  try {
    return await transporter.sendMail({
      from: `"TasteScope AI Alerts" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject,
      html,
    });
  } catch (err) {
    console.warn('[Mailer] sendPasswordChangedEmail failed:', err.message);
    return null;
  }
};

const sendNewLoginDetectedEmail = async (user, userEmail, userName, deviceDetails) => {
  if (!shouldSendEmail(user)) return null;
  if (!userEmail) return null;

  const displayName = String(userName || user?.name || 'there').trim();
  const deviceDescription = safeDeviceDetails(deviceDetails);
  const locationDescription = typeof deviceDetails === 'object' && deviceDetails.location
    ? deviceDetails.location
    : typeof deviceDetails === 'object' && deviceDetails.ip
      ? deviceDetails.ip
      : 'Unknown location';

  const subject = 'New login detected on your TasteScope account';
  const html = buildEmailTemplate({
    title: 'Security Alert: New Login Detected',
    intro: `A new login was detected on your TasteScope account. Device: ${deviceDescription}. Location: ${locationDescription}. If this was you, no action is needed.`,
    contentHtml: `<p style="margin:0 0 16px;">Hi ${displayName},</p>
      <p style="margin:0 0 8px;">We detected a login from the following device:</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#475569;">
        <li><strong>Device:</strong> ${deviceDescription}</li>
        <li><strong>Location:</strong> ${locationDescription}</li>
      </ul>
      <p style="margin:0;">If this activity looks unfamiliar, please secure your account immediately by contacting support.</p>`,
    accentColor: '#dc2626',
  });

  try {
    return await transporter.sendMail({
      from: `"TasteScope AI Alerts" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject,
      html,
    });
  } catch (err) {
    console.warn('[Mailer] sendNewLoginDetectedEmail failed:', err.message);
    return null;
  }
};

const sendAiAnalysisCompleteEmail = async (user, userEmail, userName, restaurantName, score, restaurantId) => {
  if (!shouldSendEmail(user)) return null;
  if (!userEmail) return null;

  const displayName = String(userName || user?.name || 'there').trim();
  const normalizedScore = typeof score === 'number' ? Number(score).toFixed(1) : String(score || 'N/A');
  const restaurantLabel = String(restaurantName || 'the restaurant').trim();

  const subject = `AI analysis complete for ${restaurantLabel}`;
  const html = buildEmailTemplate({
    title: 'AI Review Analysis Complete',
    intro: `Great news ${displayName}! Our RoBERTa AI model has finished analyzing all Google reviews for ${restaurantLabel}. The current sentiment score is ${normalizedScore}/5.`,
    contentHtml: `
      <p style="margin:0 0 16px;">Your report is ready with a full breakdown of sentiment trends, ratings signals, and top insights from reviewer feedback.</p>
      <!-- 🎯 RESTORED: Your required sentence line placed cleanly right above the button element -->
      <p style="margin:0 0 0;">Click the button below to see the full analytics breakdown in TasteScope.</p>
    `,
    buttonText: 'View analysis details',
    buttonUrl: `http://localhost:3000/dashboard?search=${encodeURIComponent(restaurantLabel)}`,
    accentColor: '#0f766e',
  });

  try {
    return await transporter.sendMail({
      from: `"TasteScope AI Alerts" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject,
      html,
    });
  } catch (err) {
    console.warn('[Mailer] sendAiAnalysisCompleteEmail failed:', err.message);
    return null;
  }
};

module.exports = {
  sendPasswordChangedEmail,
  sendNewLoginDetectedEmail,
  sendAiAnalysisCompleteEmail,
};
