const authService = require('./auth.service');
const AuthLog = require('../../models/AuthLog');

function getRequestMeta(req) {
  const xf = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(xf) ? xf[0] : (xf || '')).toString().split(',')[0].trim() || req.ip || '';
  const userAgent = req.get('user-agent') || '';
  return { ip, userAgent };
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
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500);
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user.sub, req.body);
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
  forgotPassword, resetPassword
};