const { sendMail, isEmailConfigured } = require('./email');

const BASE_URL = () => process.env.APP_BASE_URL || 'http://localhost:5173';

/**
 * Email to prescripteur when an artisan applies to their service request
 */
async function sendApplicationReceivedEmail(prescripteur, artisan, serviceRequest) {
  if (!isEmailConfigured()) return;
  try {
    const link = `${BASE_URL()}/prescripteur/service-requests`;
    const subject = `📬 Nouvelle candidature pour "${serviceRequest.title}"`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#4f46e5;margin:0;">Nouvelle candidature reçue</h1>
        </div>
        <p style="color:#333;">Bonjour <strong>${prescripteur.firstName}</strong>,</p>
        <p style="color:#555;">Un artisan vient de postuler à votre demande de service.</p>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#666;width:40%;"><strong>Demande :</strong></td>
              <td style="padding:6px 0;color:#333;">${serviceRequest.title}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#666;"><strong>Artisan :</strong></td>
              <td style="padding:6px 0;color:#333;">${artisan.firstName} ${artisan.lastName}</td>
            </tr>
            ${serviceRequest.city ? `<tr>
              <td style="padding:6px 0;color:#666;"><strong>Ville :</strong></td>
              <td style="padding:6px 0;color:#333;">${serviceRequest.city}</td>
            </tr>` : ''}
            ${serviceRequest.budgetTND > 0 ? `<tr>
              <td style="padding:6px 0;color:#666;"><strong>Budget :</strong></td>
              <td style="padding:6px 0;color:#333;">${serviceRequest.budgetTND.toLocaleString('fr-TN')} TND</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="text-align:center;margin:28px 0;">
          <a href="${link}" style="background:#4f46e5;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
            Voir les candidatures
          </a>
        </div>

        <div style="border-top:1px solid #e0e0e0;padding-top:16px;text-align:center;color:#999;font-size:12px;">
          <p>© ${new Date().getFullYear()} BMP.tn — Tous droits réservés</p>
        </div>
      </div>
    `;

    const text = `Bonjour ${prescripteur.firstName},\n\nL'artisan ${artisan.firstName} ${artisan.lastName} a postulé à votre demande "${serviceRequest.title}".\n\nVoir les candidatures : ${link}`;

    await sendMail({ to: prescripteur.email, subject, html, text });
    console.log(`📧 Email candidature envoyé à ${prescripteur.email}`);
  } catch (err) {
    console.error('serviceRequestEmail error:', err.message);
  }
}

/**
 * Email to artisan when their application is accepted
 */
async function sendApplicationAcceptedEmail(artisan, serviceRequest) {
  if (!isEmailConfigured()) return;
  try {
    const link = `${BASE_URL()}/artisan/service-requests`;
    const subject = `✅ Candidature acceptée — "${serviceRequest.title}"`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#059669;margin:0;">Candidature acceptée !</h1>
        </div>
        <p style="color:#333;">Bonjour <strong>${artisan.firstName}</strong>,</p>
        <p style="color:#555;">Bonne nouvelle ! Votre candidature pour la demande suivante a été <strong style="color:#059669;">acceptée</strong>.</p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;font-weight:bold;color:#065f46;">${serviceRequest.title}</p>
          ${serviceRequest.city ? `<p style="margin:4px 0 0;color:#047857;font-size:14px;">📍 ${serviceRequest.city}</p>` : ''}
        </div>

        <div style="text-align:center;margin:28px 0;">
          <a href="${link}" style="background:#059669;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
            Voir mes candidatures
          </a>
        </div>

        <div style="border-top:1px solid #e0e0e0;padding-top:16px;text-align:center;color:#999;font-size:12px;">
          <p>© ${new Date().getFullYear()} BMP.tn — Tous droits réservés</p>
        </div>
      </div>
    `;

    const text = `Bonjour ${artisan.firstName},\n\nVotre candidature pour "${serviceRequest.title}" a été acceptée.\n\nVoir : ${link}`;
    await sendMail({ to: artisan.email, subject, html, text });
    console.log(`📧 Email acceptation envoyé à ${artisan.email}`);
  } catch (err) {
    console.error('serviceRequestEmail error:', err.message);
  }
}

module.exports = { sendApplicationReceivedEmail, sendApplicationAcceptedEmail };
