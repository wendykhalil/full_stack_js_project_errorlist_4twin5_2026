const authService = require('./auth.service');
const AuthLog = require('../../models/AuthLog');
const ActivityLog = require('../../models/ActivityLog');
const { notify } = require('../../utils/notify');
const { lookupIpGeo, isPrivateOrLocal } = require('../../utils/ipGeo');

function normalizeIp(ip) {
  const raw = String(ip || '').trim();
  if (!raw) return '';
  const clean = raw.split(',')[0].trim();
  if (clean.startsWith('::ffff:')) return clean.slice(7);
  return clean;
}

function getRequestMeta(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const clientIp = req.headers['x-client-ip'];
  const fallbackIp = normalizeIp(Array.isArray(forwarded) ? forwarded[0] : forwarded) || normalizeIp(realIp) || normalizeIp(req.ip) || '';
  const ip = (!fallbackIp || isPrivateOrLocal(fallbackIp)) ? normalizeIp(clientIp) || fallbackIp : fallbackIp;
  const userAgent = req.get('user-agent') || '';
  const country = String(req.headers['x-client-country'] || '').trim();
  const countryCode = String(req.headers['x-client-country-code'] || '').trim();
  return { ip, userAgent, country, countryCode };
}

async function logActivity(req, userId, action, details = {}) {
  try {
    const { ip, userAgent, country: clientCountry, countryCode: clientCountryCode } = getRequestMeta(req);
    const geo = await lookupIpGeo(ip, { country: clientCountry, countryCode: clientCountryCode });
    await ActivityLog.create({
      user: userId,
      action,
      details,
      ip,
      country: geo.country || clientCountry || '',
      countryCode: geo.countryCode || clientCountryCode || '',
      userAgent,
    });
  } catch (_) {}
}

async function notifyAdminAboutActivity({ req, userId, action, details, sendEmail = true }) {
  try {
    const { ip, userAgent, country: clientCountry, countryCode: clientCountryCode } = getRequestMeta(req);
    const geo = await lookupIpGeo(ip, { country: clientCountry, countryCode: clientCountryCode });
    await notify({
      toAdmins: true,
      payload: {
        type: 'activity',
        title: `Activity: ${action}`,
        message: `User performed: ${action}`,
        meta: { action, details, ip, country: geo.country || clientCountry || '', countryCode: geo.countryCode || clientCountryCode || '', userAgent },
      },
      sendEmail,
    });
  } catch (_) {}
}

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      ok: true,
      message: 'Compte créé. Vérifiez votre email pour confirmer, puis connectez-vous.',
      user: result.user,
      devLink: result.devLink || null,
    });
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    try {
      const { ip, userAgent, country: clientCountry, countryCode: clientCountryCode } = getRequestMeta(req);
      const geo = await lookupIpGeo(ip, { country: clientCountry, countryCode: clientCountryCode });
      await AuthLog.create({ user: result.user._id, action: 'LOGIN', ip, country: geo.country || clientCountry || '', countryCode: geo.countryCode || clientCountryCode || '', userAgent });
    } catch (_) {}
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function googleLogin(req, res, next) {
  try {
    const result = await authService.googleLogin(req.body);
    try {
      const { ip, userAgent, country: clientCountry, countryCode: clientCountryCode } = getRequestMeta(req);
      const geo = await lookupIpGeo(ip, { country: clientCountry, countryCode: clientCountryCode });
      await AuthLog.create({ user: result.user._id, action: 'LOGIN_GOOGLE', ip, country: geo.country || clientCountry || '', countryCode: geo.countryCode || clientCountryCode || '', userAgent });
    } catch (_) {}
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

// ✅ CORRECTION ICI : Gestion correcte des données
async function updateProfile(req, res, next) {
  try {
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('req.user._id:', req.user._id);
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    
    // Récupérer les données
    let profileData = req.body;
    
    // Si les données sont stringifiées dans 'data'
    if (req.body.data) {
      try {
        profileData = JSON.parse(req.body.data);
        console.log('Parsed data from data field:', profileData);
      } catch (e) {
        console.error('Error parsing data:', e);
      }
    }
    
    // Ajouter le logo si uploadé
    if (req.file) {
      profileData.logo = `/uploads/${req.file.filename}`;
      console.log('Logo uploaded:', profileData.logo);
    }
    
    console.log('Final profile data:', profileData);
    
    const result = await authService.updateProfile(req.user._id, profileData);
    console.log('Update result:', result);
    
    await logActivity(req, req.user._id, 'PROFILE_UPDATE', profileData);
    await notifyAdminAboutActivity({ req, userId: req.user._id, action: 'PROFILE_UPDATE', details: profileData });
    
    res.json(result);
  } catch (err) {
    console.error('❌ Update profile error:', err);
    console.error('Error stack:', err.stack);
    res.status(err.statusCode || 500).json({ 
      message: err.message 
    });
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user._id, req.body);
    await logActivity(req, req.user._id, 'PASSWORD_CHANGE');
    await notifyAdminAboutActivity({ req, userId: req.user._id, action: 'PASSWORD_CHANGE', details: {} });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    try {
      const { ip, userAgent, country: clientCountry, countryCode: clientCountryCode } = getRequestMeta(req);
      const geo = await lookupIpGeo(ip, { country: clientCountry, countryCode: clientCountryCode });
      await AuthLog.create({ user: req.user._id, action: 'LOGOUT', ip, country: geo.country || clientCountry || '', countryCode: geo.countryCode || clientCountryCode || '', userAgent });
    } catch (_) {}

    await logActivity(req, req.user._id, 'LOGOUT');
    await notifyAdminAboutActivity({ req, userId: req.user._id, action: 'LOGOUT', details: {}, sendEmail: false });

    res.json({ ok: true });
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.me(req.user._id);
    res.json({ user });
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const token = String(req.query.token || '');
    const result = await authService.verifyEmail({ token });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

async function resendVerification(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const result = await authService.resendVerification({ email });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function phoneStart(req, res, next) {
  try {
    const result = await authService.phoneStart(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function phoneVerify(req, res, next) {
  try {
    const result = await authService.phoneVerify(req.body);
    try {
      const { ip, userAgent, country: clientCountry, countryCode: clientCountryCode } = getRequestMeta(req);
      const geo = await lookupIpGeo(ip, { country: clientCountry, countryCode: clientCountryCode });
      await AuthLog.create({ user: result.user._id, action: 'LOGIN_SMS', ip, country: geo.country || clientCountry || '', countryCode: geo.countryCode || clientCountryCode || '', userAgent });
    } catch (_) {}

    await logActivity(req, result.user._id, 'LOGIN_SMS', { phone: result.user.phone });
    await notifyAdminAboutActivity({ req, userId: result.user._id, action: 'LOGIN_SMS', details: { phone: result.user.phone }, sendEmail: false });

    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function setRole(req, res, next) {
  try {
    const result = await authService.setRole(req.user._id, req.body);
    await logActivity(req, req.user._id, 'SET_ROLE', { role: result.user.role });
    await notifyAdminAboutActivity({ req, userId: req.user._id, action: 'SET_ROLE', details: { role: result.user.role } });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

module.exports = {
  register, login, googleLogin, logout, me, verifyEmail, resendVerification,
  updateProfile, changePassword,
  phoneStart, phoneVerify, setRole,
  forgotPassword, resetPassword
};