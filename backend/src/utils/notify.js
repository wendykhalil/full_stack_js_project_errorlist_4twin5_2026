const { sendMail, isEmailConfigured } = require('./email');
const { notifyUser, notifyAdmins } = require('../socket');

function parseEmailList(value) {
  return String(value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

async function sendNotificationEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) return { skipped: true };
  await sendMail({ to, subject, html, text });
  return { ok: true };
}

/**
 * Emit realtime notification to the user room and optionally email a list.
 * The payload should be UI-friendly: { type, title, message, meta, createdAt }
 */
async function notify({ userId, payload, emailTo, toAdmins = false, sendEmail = true }) {
  const enriched = { ...payload, createdAt: payload.createdAt || new Date().toISOString() };

  // realtime
  if (toAdmins) notifyAdmins(enriched);
  if (userId) notifyUser(userId, enriched);

  // email
  const toList = emailTo?.length ? emailTo : parseEmailList(process.env.NOTIFY_EMAILS);
  if (sendEmail && toList.length) {
    const subject = `[BMP.tn] ${payload.title || payload.type || 'Notification'}`;
    const text = buildPlainTextEmail({ payload, enriched });
    const html = buildHtmlEmail({ payload, enriched });
    await sendNotificationEmail({ to: toList.join(','), subject, html, text });
  }

  return { ok: true };
}

function buildPlainTextEmail({ payload, enriched }) {
  const lines = [];
  lines.push(payload.title || 'BMP.tn Notification');
  if (payload.message) lines.push(payload.message);
  lines.push('');
  lines.push(`Date: ${new Date(enriched.createdAt).toLocaleString('fr-TN')}`);
  if (payload.meta) {
    lines.push('');
    lines.push('Meta:');
    try {
      lines.push(JSON.stringify(payload.meta, null, 2));
    } catch (_) {
      lines.push(String(payload.meta));
    }
  }
  return lines.join('\n');
}

function buildHtmlEmail({ payload, enriched }) {
  const title = escapeHtml(payload.title || 'BMP.tn Notification');
  const message = escapeHtml(payload.message || '');
  const createdAt = escapeHtml(new Date(enriched.createdAt).toLocaleString('fr-TN'));

  const meta = payload.meta && typeof payload.meta === 'object' ? payload.meta : null;
  const metaRows = meta ? renderMetaRows(meta) : '';
  const rawJson = meta ? escapeHtml(JSON.stringify(meta, null, 2)) : '';

  // Table-based layout for maximum email client compatibility.
  return `
  <div style="margin:0;padding:0;background:#f5f7fb">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:18px 22px;background:#111827;color:#ffffff;">
                <div style="font-size:14px;opacity:.9;">BMP.tn</div>
                <div style="font-size:20px;font-weight:700;margin-top:4px;">${title}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 22px;color:#111827;font-family:Arial,Helvetica,sans-serif;">
                <div style="font-size:14px;line-height:20px;color:#374151;margin-bottom:14px;">${message}</div>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:8px;">
                  <tr>
                    <td style="padding:8px 0;font-size:12px;color:#6b7280;width:120px;">Date</td>
                    <td style="padding:8px 0;font-size:12px;color:#111827;font-weight:600;">${createdAt}</td>
                  </tr>
                </table>

                ${metaRows ? `
                <div style="margin-top:16px;font-size:13px;font-weight:700;color:#111827;">Details</div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:6px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                  ${metaRows}
                </table>
                ` : ''}

                ${rawJson ? `
                <div style="margin-top:16px;font-size:12px;color:#6b7280;">Raw JSON (for debugging)</div>
                <pre style="margin:8px 0 0;background:#0b1220;color:#e5e7eb;padding:12px;border-radius:12px;font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word;">${rawJson}</pre>
                ` : ''}

                <div style="margin-top:18px;font-size:12px;color:#9ca3af;">This is an automated notification from BMP.tn.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
}

function renderMetaRows(meta) {
  // Friendly ordering for common fields
  const preferred = ['action', 'userId', 'email', 'phone', 'ip', 'country', 'userAgent', 'details'];
  const keys = Array.from(new Set([...preferred, ...Object.keys(meta)])).filter((k) => meta[k] !== undefined);

  return keys
    .map((k) => {
      const v = meta[k];
      const label = escapeHtml(String(k));
      const value = escapeHtml(formatMetaValue(v));
      return `
        <tr>
          <td style="padding:10px 12px;background:#f9fafb;font-size:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;width:160px;vertical-align:top;"><b>${label}</b></td>
          <td style="padding:10px 12px;font-size:12px;color:#111827;border-bottom:1px solid #e5e7eb;vertical-align:top;">${value}</td>
        </tr>
      `;
    })
    .join('');
}

function formatMetaValue(v) {
  if (v === null) return 'null';
  if (v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch (_) {
    return String(v);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

module.exports = { notify };
