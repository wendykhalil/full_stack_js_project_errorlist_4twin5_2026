const authService = require('./auth.service');
const AuthLog = require('../../models/AuthLog');
const ActivityLog = require('../../models/ActivityLog');
const { notify } = require('../../utils/notify');
const { lookupIpGeo } = require('../../utils/ipGeo');

function getRequestMeta(req) {

  const xf = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(xf) ? xf[0] : (xf || '')).toString().split(',')[0].trim() || req.ip || '';
  const userAgent = req.get('user-agent') || '';
  return { ip, userAgent };
}


async function logActivity(req, userId, action, details = {}) {
  try {
    const { ip, userAgent } = getRequestMeta(req);
    const geo = await lookupIpGeo(ip);
    await ActivityLog.create({
      user: userId,
      action,
      details,
      ip,
      country: geo.country || '',
      countryCode: geo.countryCode || '',
      userAgent,
    });
  } catch (_) {}
}

async function notifyAdminAboutActivity({ req, userId, action, details }) {
  // realtime broadcast to admins + optional email via NOTIFY_EMAILS
  try {
    const { ip, userAgent } = getRequestMeta(req);
    const geo = await lookupIpGeo(ip);
    await notify({
      toAdmins: true,
      payload: {
        type: 'activity',
        title: `Activity: ${action}`,
        message: `User performed: ${action}`,
        meta: { userId, action, details, ip, country: geo.country || '', userAgent },
      },
    });
  } catch (_) {}
}


async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    // Do not log user in automatically. User must verify email then login.
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

    // Audit log (best-effort)
    try {
      const { ip, userAgent } = getRequestMeta(req);
      await AuthLog.create({ user: result.user._id, action: 'LOGIN', ip, userAgent });
    } catch (_) {
      // ignore logging errors
    }

    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}



async function googleLogin(req, res, next) {
  try {
    const result = await authService.googleLogin(req.body);

    // Audit log (best-effort)
    try {
      const { ip, userAgent } = getRequestMeta(req);
      await AuthLog.create({ user: result.user._id, action: 'LOGIN_GOOGLE', ip, userAgent });
    } catch (_) {}

    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const result = await authService.updateProfile(req.user.sub, req.body);
    await logActivity(req, req.user.sub, 'PROFILE_UPDATE', req.body);
    await notifyAdminAboutActivity({ req, userId: req.user.sub, action: 'PROFILE_UPDATE', details: req.body });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user.sub, req.body);
    await logActivity(req, req.user.sub, 'PASSWORD_CHANGE');
    await notifyAdminAboutActivity({ req, userId: req.user.sub, action: 'PASSWORD_CHANGE', details: {} });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    // JWT is stateless, so "logout" here is only for auditing.
    try {
      const { ip, userAgent } = getRequestMeta(req);
      await AuthLog.create({ user: req.user.sub, action: 'LOGOUT', ip, userAgent });
    } catch (_) {
      // ignore logging errors
    }

    await logActivity(req, req.user.sub, 'LOGOUT');
    await notifyAdminAboutActivity({ req, userId: req.user.sub, action: 'LOGOUT', details: {} });

    res.json({ ok: true });
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.me(req.user.sub);
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

    // best-effort logs
    try {
      const { ip, userAgent } = getRequestMeta(req);
      await AuthLog.create({ user: result.user._id, action: 'LOGIN', ip, userAgent });
    } catch (_) {}

    await logActivity(req, result.user._id, 'LOGIN_SMS', { phone: result.user.phone });
    await notifyAdminAboutActivity({ req, userId: result.user._id, action: 'LOGIN_SMS', details: { phone: result.user.phone } });

    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function setRole(req, res, next) {
  try {
    const result = await authService.setRole(req.user.sub, req.body);
    await logActivity(req, req.user.sub, 'SET_ROLE', { role: result.user.role });
    await notifyAdminAboutActivity({ req, userId: req.user.sub, action: 'SET_ROLE', details: { role: result.user.role } });
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