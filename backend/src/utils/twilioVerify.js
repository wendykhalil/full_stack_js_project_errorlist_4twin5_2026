const twilio = require('twilio');

function isTwilioConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);
}

function getClient() {
  if (!isTwilioConfigured()) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function startPhoneVerification(phone) {
  const client = getClient();
  if (!client) {
    const e = new Error('Twilio is not configured (missing TWILIO_* env vars)');
    e.statusCode = 500;
    throw e;
  }

  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const result = await client.verify.v2.services(serviceSid)
    .verifications
    .create({ to: phone, channel: 'sms' });

  return { sid: result.sid, status: result.status };
}

async function checkPhoneVerification(phone, code) {
  const client = getClient();
  if (!client) {
    const e = new Error('Twilio is not configured (missing TWILIO_* env vars)');
    e.statusCode = 500;
    throw e;
  }

  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const result = await client.verify.v2.services(serviceSid)
    .verificationChecks
    .create({ to: phone, code });

  return { sid: result.sid, status: result.status, valid: result.valid };
}

module.exports = { isTwilioConfigured, startPhoneVerification, checkPhoneVerification };
