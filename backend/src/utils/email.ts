// Sends transactional email via Brevo's REST API (free tier: 300 emails/day,
// no credit card required). Docs: https://developers.brevo.com/reference/sendtransacemail

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface BrevoEmailPayload {
  sender: { name: string; email: string };
  to: { email: string }[];
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
}

async function sendViaBrevo(payload: BrevoEmailPayload): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY is not set in .env");

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${body}`);
  }
}

/**
 * Shared branded template. Email clients strip <style> tags unpredictably,
 * so everything is inline CSS - the one place in this codebase that's
 * deliberately verbose for compatibility reasons.
 */
function renderEmailTemplate(opts: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}): string {
  const { preheader, heading, bodyHtml, ctaLabel, ctaUrl, footerNote } = opts;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${heading}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F4F3F0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <!-- Preheader text, hidden, shows in inbox preview -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F3F0; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E5E3DD;">

            <!-- Header -->
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:32px; height:32px; background-color:#B8763A; border-radius:9px; text-align:center; vertical-align:middle;">
                      <span style="font-family:-apple-system,Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; color:#FFFFFF; line-height:32px;">R</span>
                    </td>
                    <td style="padding-left:10px; font-family:-apple-system,Helvetica,Arial,sans-serif; font-size:14px; font-weight:600; color:#12141A;">
                      Relay
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <h1 style="margin:0 0 16px 0; font-size:20px; line-height:28px; color:#1A1A18; font-weight:600;">
                  ${heading}
                </h1>
                <div style="font-size:15px; line-height:24px; color:#4A4A46;">
                  ${bodyHtml}
                </div>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#B8763A; border-radius:8px;">
                      <a href="${ctaUrl}" target="_blank" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none;">
                        ${ctaLabel}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0 0; font-size:12px; line-height:18px; color:#9A9A95; word-break:break-all;">
                  Or paste this link into your browser:<br />
                  <a href="${ctaUrl}" style="color:#B8763A;">${ctaUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px; background-color:#FAFAF8; border-top:1px solid #E5E3DD;">
                <p style="margin:0; font-size:12px; line-height:18px; color:#9A9A95;">
                  ${footerNote}
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${token}`;

  const html = renderEmailTemplate({
    preheader: "Confirm your email to finish setting up your account.",
    heading: "Verify your email address",
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Welcome aboard. Confirm your email to finish setting up your account and unlock full access.</p>
      <p style="margin:0; color:#9A9A95; font-size:13px;">This link expires in 24 hours.</p>
    `,
    ctaLabel: "Verify email",
    ctaUrl: link,
    footerNote: "If you didn't create this account, you can safely ignore this email.",
  });

  await sendViaBrevo({
    sender: {
      name: process.env.BREVO_SENDER_NAME || "Relay",
      email: process.env.BREVO_SENDER_EMAIL as string,
    },
    to: [{ email: to }],
    subject: "Verify your email address",
    htmlContent: html,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  const html = renderEmailTemplate({
    preheader: "Reset your password - this link expires in 1 hour.",
    heading: "Reset your password",
    bodyHtml: `
      <p style="margin:0 0 12px 0;">We received a request to reset your password. Click below to choose a new one.</p>
      <p style="margin:0; color:#9A9A95; font-size:13px;">This link expires in 1 hour.</p>
    `,
    ctaLabel: "Reset password",
    ctaUrl: link,
    footerNote: "If you didn't request this, you can safely ignore this email - your password won't change.",
  });

  await sendViaBrevo({
    sender: {
      name: process.env.BREVO_SENDER_NAME || "Relay",
      email: process.env.BREVO_SENDER_EMAIL as string,
    },
    to: [{ email: to }],
    subject: "Reset your password",
    htmlContent: html,
  });
}

/**
 * Invites a new teammate to a business. Reuses the reset-password acceptance
 * page (the invitee sets their own password there) instead of a separate flow.
 */
export async function sendTeamInviteEmail(
  to: string,
  inviterName: string,
  businessName: string,
  token: string
): Promise<void> {
  const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  const html = renderEmailTemplate({
    preheader: `${inviterName} invited you to join ${businessName} on Relay.`,
    heading: `You're invited to join ${escapeHtml(businessName)}`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">${escapeHtml(inviterName)} invited you to join <strong>${escapeHtml(businessName)}</strong> on Relay.</p>
      <p style="margin:0; color:#9A9A95; font-size:13px;">Set a password to activate your account. This link expires in 7 days.</p>
    `,
    ctaLabel: "Accept invite",
    ctaUrl: link,
    footerNote: "If you weren't expecting this, you can safely ignore this email.",
  });

  await sendViaBrevo({
    sender: {
      name: process.env.BREVO_SENDER_NAME || "Relay",
      email: process.env.BREVO_SENDER_EMAIL as string,
    },
    to: [{ email: to }],
    subject: `${inviterName} invited you to join ${businessName} on Relay`,
    htmlContent: html,
  });
}

/**
 * Sends a homepage contact-form submission to the site owner, with
 * reply-to set to the visitor's email so replying goes straight to them.
 */
export async function sendContactEmail(name: string, fromEmail: string, message: string): Promise<void> {
  const receiver = process.env.CONTACT_RECEIVER_EMAIL || (process.env.BREVO_SENDER_EMAIL as string);

  const html = renderEmailTemplate({
    preheader: `New message from ${name} via the Relay contact form.`,
    heading: "New contact form message",
    bodyHtml: `
      <p style="margin:0 0 12px 0;"><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(fromEmail)})</p>
      <p style="margin:0 0 12px 0; white-space:pre-wrap;">${escapeHtml(message)}</p>
    `,
    ctaLabel: "Reply to sender",
    ctaUrl: `mailto:${fromEmail}`,
    footerNote: "Sent from the contact form on your Relay homepage.",
  });

  await sendViaBrevo({
    sender: {
      name: process.env.BREVO_SENDER_NAME || "Relay",
      email: process.env.BREVO_SENDER_EMAIL as string,
    },
    to: [{ email: receiver }],
    subject: `New contact message from ${name}`,
    htmlContent: html,
    replyTo: { email: fromEmail, name },
  });
}

/** Minimal HTML escaping for user-submitted text dropped into the email template. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}