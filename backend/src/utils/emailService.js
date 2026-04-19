const { sendMail, isEmailConfigured } = require('./email');

function formatDateTime(date) {
  return new Intl.DateTimeFormat('fr-TN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

async function sendMeetingConfirmationEmail({
  artisanId,
  prescripteurId,
  meetingId,
  artisanName,
  artisanEmail,
  prescripteurName,
  prescripteurEmail,
  startDateTime,
  endDateTime,
  description,
  googleMeetLink,
}) {
  if (!isEmailConfigured()) {
    console.log('[Email Disabled] Meeting confirmation would be sent to:', artisanEmail, prescripteurEmail);
    return;
  }

  const meetingUrl = `${process.env.APP_BASE_URL || 'http://localhost:5173'}/artisan/meetings/${meetingId}`;
  const formattedStart = formatDateTime(startDateTime);
  const formattedEnd = formatDateTime(endDateTime);

  // Email to artisan
  const artisanHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Nouvelle demande de réunion</h2>
      <p>Bonjour ${artisanName},</p>
      <p>${prescripteurName} souhaite planifier une réunion avec vous.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date et heure:</strong> ${formattedStart} - ${formattedEnd}</p>
        ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
        ${googleMeetLink ? `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;"><strong>Lien de la réunion:</strong><br/><a href="${googleMeetLink}" style="display: inline-block; margin-top: 8px; padding: 10px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">🎥 Rejoindre la réunion</a></p>` : ''}
      </div>

      <p>Vous pouvez accepter ou refuser cette demande depuis votre tableau de bord.</p>
      
      <a href="${meetingUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Voir la demande
      </a>

      <p style="color: #6b7280; font-size: 12px; margin-top: 40px;">
        Cet email a été envoyé depuis BMP.tn. Merci de ne pas répondre directement à cet email.
      </p>
    </div>
  `;

  // Email to prescripteur
  const prescripteurHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Demande de réunion envoyée</h2>
      <p>Bonjour ${prescripteurName},</p>
      <p>Votre demande de réunion avec ${artisanName} a été envoyée avec succès.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Artisan:</strong> ${artisanName}</p>
        <p><strong>Date et heure:</strong> ${formattedStart} - ${formattedEnd}</p>
        ${description ? `<p><strong>Votre message:</strong> ${description}</p>` : ''}
        ${googleMeetLink ? `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;"><strong>Lien de la réunion:</strong><br/><a href="${googleMeetLink}" style="display: inline-block; margin-top: 8px; padding: 10px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">🎥 Rejoindre la réunion</a></p>` : ''}
      </div>

      <p>L'artisan recevra votre demande et vous notifiera dès qu'il l'aura acceptée ou refusée.</p>
      
      <a href="${meetingUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Suivre la demande
      </a>

      <p style="color: #6b7280; font-size: 12px; margin-top: 40px;">
        Cet email a été envoyé depuis BMP.tn. Merci de ne pas répondre directement à cet email.
      </p>
    </div>
  `;

  try {
    await Promise.all([
      sendMail({
        to: artisanEmail,
        subject: `Nouvelle demande de réunion de ${prescripteurName}`,
        html: artisanHtml,
      }),
      sendMail({
        to: prescripteurEmail,
        subject: 'Votre demande de réunion a été envoyée',
        html: prescripteurHtml,
      }),
    ]);
  } catch (error) {
    console.error('Error sending meeting confirmation emails:', error);
    throw error;
  }
}

async function sendMeetingStatusChangeEmail({
  meeting,
  artisanName,
  prescripteurEmail,
  prescripteurName,
  status,
}) {
  if (!isEmailConfigured()) {
    console.log('[Email Disabled] Meeting status change would be sent to:', prescripteurEmail);
    return;
  }

  const meetingUrl = `${process.env.APP_BASE_URL || 'http://localhost:5173'}/prescripteur/meetings/${meeting._id}`;
  const formattedStart = formatDateTime(meeting.startDateTime);
  const formattedEnd = formatDateTime(meeting.endDateTime);

  let subject = '';
  let statusMessage = '';
  let statusColor = '';

  if (status === 'accepted') {
    subject = `${artisanName} a accepté votre demande de réunion`;
    statusMessage = `<p style="color: #10b981; font-size: 18px; font-weight: bold;">✓ Acceptée</p>`;
    statusColor = '#10b981';
  } else if (status === 'rejected') {
    subject = `${artisanName} a refusé votre demande de réunion`;
    statusMessage = `<p style="color: #ef4444; font-size: 18px; font-weight: bold;">✗ Refusée</p>`;
    statusColor = '#ef4444';
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Réponse à votre demande de réunion</h2>
      <p>Bonjour ${prescripteurName},</p>
      
      ${statusMessage}
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Artisan:</strong> ${artisanName}</p>
        <p><strong>Date et heure:</strong> ${formattedStart} - ${formattedEnd}</p>
        ${meeting.notes ? `<p><strong>Remarques:</strong> ${meeting.notes}</p>` : ''}
      </div>

      ${status === 'accepted' ? `
        <p>L'artisan a accepté votre demande de réunion. Vous pouvez maintenant coordonner les détails avec lui.</p>
      ` : `
        <p>L'artisan a refusé votre demande. Vous pouvez proposer une autre date ou contacter un autre artisan.</p>
      `}
      
      <a href="${meetingUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Voir les détails
      </a>

      <p style="color: #6b7280; font-size: 12px; margin-top: 40px;">
        Cet email a été envoyé depuis BMP.tn. Merci de ne pas répondre directement à cet email.
      </p>
    </div>
  `;

  try {
    await sendMail({
      to: prescripteurEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('Error sending meeting status change email:', error);
    throw error;
  }
}

module.exports = {
  sendMeetingConfirmationEmail,
  sendMeetingStatusChangeEmail,
};
