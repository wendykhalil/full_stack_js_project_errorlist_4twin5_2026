const crypto = require('node:crypto')
const { sendMail, isEmailConfigured } = require('../../utils/email');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/User');
const SupplierProfile = require('../../models/SupplierProfile'); // IMPORTANT: Ajouter cette ligne
const { startPhoneVerification, checkPhoneVerification } = require('../../utils/twilioVerify');

const REGISTER_ROLE = 'REGISTER_ROLE';
const ROLE_ENUM = ['ARTISAN', 'PRESCRIPTEUR', 'SUPPLIER', 'ADMIN'];

// ✅ Lazy / safe Google client creation
let _googleClient = null;
let _googleClientId = null;

function getGoogleClient() {
  const cid = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!cid) return { client: null, clientId: '' };

  // recreate if env changed
  if (!_googleClient || _googleClientId !== cid) {
    _googleClientId = cid;
    _googleClient = new OAuth2Client(cid);
  }
  return { client: _googleClient, clientId: cid };
}

function makeToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildVerifyLink(token) {
  const base = process.env.APP_BASE_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
}

async function sendVerificationEmail({ email, token }) {
  const link = buildVerifyLink(token);
  const subject = 'Confirmez votre email - BMP.tn';
  const text = `Bienvenue sur BMP.tn. Confirmez votre email en ouvrant ce lien: ${link}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 12px">Confirmez votre email</h2>
      <p>Bienvenue sur <b>BMP.tn</b>. Pour activer votre compte, veuillez confirmer votre adresse email.</p>
      <p style="margin:18px 0">
        <a href="${link}" style="background:#4338ca;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;display:inline-block">
          Confirmer mon email
        </a>
      </p>
      <p style="color:#475569;font-size:13px">Si le bouton ne marche pas, copiez/collez ce lien :<br/>${link}</p>
    </div>
  `;
  await sendMail({ to: email, subject, text, html });
  return link;
}

function signJwt(user, extra = {}) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, ...extra },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(userDoc) {
  const u = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete u.password;
  return u;
}

async function register({ firstName, lastName, email, password, phone, role }) {
  if (!ROLE_ENUM.includes(role)) {
    const e = new Error('Rôle invalide'); e.statusCode = 400; throw e;
  }

  // SECURITY: Admin accounts cannot be created via public registration.
  // They must be assigned directly in the database by a system administrator.
  if (role === 'ADMIN') {
    const e = new Error('Rôle invalide'); e.statusCode = 400; throw e;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    const e = new Error('Email déjà utilisé'); e.statusCode = 409; throw e;
  }

  const hashed = await bcrypt.hash(password, 12);
  const verificationToken = makeToken();
  const verificationTokenHash = hashToken(verificationToken);
  const expiresAt = new Date(Date.now() + (Number(process.env.EMAIL_VERIFY_EXPIRES_HOURS || 24) * 60 * 60 * 1000));

  const user = await User.create({
    firstName, lastName, email, password: hashed, phone, role,
    emailVerified: false,
    emailVerificationTokenHash: verificationTokenHash,
    emailVerificationTokenExpiresAt: expiresAt,
  });

  let devLink = null;
  if (isEmailConfigured()) {
    await sendVerificationEmail({ email: user.email, token: verificationToken });
  } else {
    devLink = buildVerifyLink(verificationToken);
    console.log('[DEV] Email verification link:', devLink);
  }

  return { user: sanitizeUser(user), devLink };
}

async function login({ email, password }) {
  // Support login by email OR phone number
  const identifier = String(email || '').trim();
  if (!identifier) {
    const e = new Error('Identifiants invalides'); e.statusCode = 401; throw e;
  }

  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phone: identifier },
    ],
  });

  if (!user) {
    const e = new Error('Identifiants invalides'); e.statusCode = 401; throw e;
  }

  if (!user.password) {
    const e = new Error('Ce compte utilise la connexion Google'); e.statusCode = 400; throw e;
  }

  const ok = await bcrypt.compare(String(password || ''), user.password);
  if (!ok) {
    const e = new Error('Identifiants invalides'); e.statusCode = 401; throw e;
  }

  const loginByPhone = /^[+\d\s]{6,}$/.test(identifier) && !identifier.includes('@');
  if (!user.emailVerified && !loginByPhone) {
    const e = new Error('Email non vérifié'); e.statusCode = 403; throw e;
  }

  if (user.status === 'BLOCKED') {
    if (user.blockedUntil && user.blockedUntil < new Date()) {
      user.status = 'ACTIVE';
      user.blockedUntil = null;
      await user.save();
    } else {
      const until = user.blockedUntil ? ` jusqu'au ${user.blockedUntil.toLocaleDateString('fr-TN')}` : '';
      const e = new Error(`Compte bloqué${until}`);
      e.statusCode = 403;
      throw e;
    }
  }

  if (user.status !== 'ACTIVE') {
    const e = new Error('Le compte n’est pas actif'); e.statusCode = 403; throw e;
  }

  const token = signJwt(user);

return { token, user: sanitizeUser(user) };
}

async function me(userId) {
  const user = await User.findById(userId).populate('supplierProfile');
  if (!user) {
    const e = new Error('Utilisateur introuvable'); 
    e.statusCode = 404; 
    throw e;
  }
  // User may not have a supplier profile - that's normal for artisans, prescripteurs, etc.
  return sanitizeUser(user);
}

async function verifyEmail({ token }) {
  if (!token) {
    const e = new Error('Token manquant'); e.statusCode = 400; throw e;
  }
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    const e = new Error('Token invalide ou expiré'); e.statusCode = 400; throw e;
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationTokenExpiresAt = null;
  await user.save();

  return { ok: true, message: 'Email vérifié. Vous pouvez maintenant vous connecter.' };
}

async function resendVerification({ email }) {
  if (!email) {
    const e = new Error('Email requis'); e.statusCode = 400; throw e;
  }

  const user = await User.findOne({ email });
  if (!user) {
    return { ok: true, message: 'Si cet email existe, un lien de vérification a été envoyé.' };
  }

  if (user.emailVerified) {
    return { ok: true, message: 'Email déjà vérifié. Vous pouvez vous connecter.' };
  }

  const verificationToken = makeToken();
  const verificationTokenHash = hashToken(verificationToken);
  const expiresAt = new Date(Date.now() + (Number(process.env.EMAIL_VERIFY_EXPIRES_HOURS || 24) * 60 * 60 * 1000));

  user.emailVerificationTokenHash = verificationTokenHash;
  user.emailVerificationTokenExpiresAt = expiresAt;
  await user.save();

  let devLink = null;
  if (isEmailConfigured()) {
    await sendVerificationEmail({ email: user.email, token: verificationToken });
  } else {
    devLink = buildVerifyLink(verificationToken);
    console.log('[DEV] Email verification link:', devLink);
  }

  return { ok: true, message: 'Email de vérification envoyé.', devLink };
}

async function googleLogin({ credential, role }) {
  if (!credential) {
    const e = new Error('Identifiant Google manquant'); e.statusCode = 400; throw e;
  }

  // role is optional. If user exists, we keep their role.
  // For NEW users, we always start with REGISTER_ROLE so they choose once in the UI.
  if (role && !ROLE_ENUM.includes(role)) {
    const e = new Error('Rôle invalide'); e.statusCode = 400; throw e;
  }

  const { client, clientId } = getGoogleClient();
  if (!clientId || !client) {
    const e = new Error('Configuration serveur manquante (GOOGLE_CLIENT_ID)'); e.statusCode = 500; throw e;
  }

  // ✅ verify with correct audience
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });

  const payload = ticket.getPayload() || {};
  const email = String(payload.email || '').toLowerCase();
  const emailVerified = Boolean(payload.email_verified);
  const sub = String(payload.sub || '');

  if (!email) {
    const e = new Error("Google n’a pas retourné d’email"); e.statusCode = 400; throw e;
  }

  let user = await User.findOne({ email });

  if (!user) {
    const firstName = String(payload.given_name || '').trim() || 'User';
    const lastName = String(payload.family_name || '').trim() || 'Google';

    user = await User.create({
      firstName,
      lastName,
      email,
      phone: '',
      role: 'REGISTER_ROLE',
      authProvider: 'GOOGLE',
      googleSub: sub || null,
      emailVerified: emailVerified || true,
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
      status: 'ACTIVE',
    });
  } else {
    let changed = false;
    if (user.authProvider !== 'GOOGLE') { user.authProvider = 'GOOGLE'; changed = true; }
    if (sub && user.googleSub !== sub) { user.googleSub = sub; changed = true; }
    if (emailVerified && !user.emailVerified) { user.emailVerified = true; changed = true; }
    if (changed) await user.save();
  }

  if (user.status === 'BLOCKED') {
    if (user.blockedUntil && user.blockedUntil < new Date()) {
      user.status = 'ACTIVE';
      user.blockedUntil = null;
      await user.save();
    } else {
      const until = user.blockedUntil ? ` jusqu'au ${user.blockedUntil.toLocaleDateString('fr-TN')}` : '';
      const e = new Error(`Compte bloqué${until}`);
      e.statusCode = 403;
      throw e;
    }
  }

  if (user.status !== 'ACTIVE') {
    const e = new Error('Le compte n’est pas actif'); e.statusCode = 403; throw e;
  }

  const token = signJwt(user);

  const needsRole = String(user.role || '') === 'REGISTER_ROLE';
  return { token, user: sanitizeUser(user), needsRole };
}

// ✅ VERSION CORRIGÉE - Met à jour User ET SupplierProfile
// ✅ VERSION CORRIGÉE - Met à jour User ET SupplierProfile
// ✅ VERSION CORRIGÉE - Met à jour User ET SupplierProfile
// ✅ VERSION CORRIGÉE - Met à jour User ET SupplierProfile
async function updateProfile(userId, profileData) {
  console.log('=== SERVICE UPDATE PROFILE ===');
  console.log('userId:', userId);
  console.log('profileData:', profileData);
  
  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found with ID:', userId);
    const e = new Error('User not found');
    e.statusCode = 404;
    throw e;
  }

  console.log('Found user:', user.email, 'Role:', user.role);

  // 1. Mettre à jour les champs de l'utilisateur
  if (profileData.firstName !== undefined) {
    user.firstName = profileData.firstName.trim() || user.firstName;
  }
  if (profileData.lastName !== undefined) {
    user.lastName = profileData.lastName.trim() || user.lastName;
  }
  if (profileData.phone !== undefined) {
    user.phone = profileData.phone.trim() || user.phone;
  }
  if (profileData.profilePicture !== undefined) {
    user.profilePicture = String(profileData.profilePicture || '').trim();
  }

  // Location fields — saved for all roles
  if (profileData.city !== undefined) user.city = String(profileData.city || '').trim();
  if (profileData.zone !== undefined) user.zone = String(profileData.zone || '').trim();
  const _lat = profileData.latitude !== undefined ? profileData.latitude : profileData.lat;
  const _lng = profileData.longitude !== undefined ? profileData.longitude : profileData.lng;
  if (_lat !== undefined && _lat !== '' && _lat !== null) {
    user.location = { lat: Number(_lat), lng: user.location?.lng ?? null, updatedAt: new Date() };
  }
  if (_lng !== undefined && _lng !== '' && _lng !== null) {
    user.location = { lat: user.location?.lat ?? null, lng: Number(_lng), updatedAt: new Date() };
  }

  await user.save();

  // 2. Si l'utilisateur est un fournisseur, mettre à jour SupplierProfile
  if (user.role === 'SUPPLIER') {
    console.log('Updating supplier profile...');
    let supplierProfile = await SupplierProfile.findOne({ userId: user._id });
    
    // Préparer les catégories
    let categories = profileData.categories;
    if (typeof categories === 'string') {
      try {
        categories = JSON.parse(categories);
      } catch (e) {
        console.error('Error parsing categories:', e);
        categories = [];
      }
    }
    
    // Créer le profil s'il n'existe pas
    if (!supplierProfile) {
      console.log('Creating new supplier profile');
      supplierProfile = new SupplierProfile({
        userId: user._id,
        companyName: profileData.companyName || '',
        phone: profileData.companyPhone || '',
        address: profileData.address || '',
        description: profileData.description || '',
        logo: profileData.logo || '',
        city: profileData.city || '',
        latitude: profileData.latitude !== undefined && profileData.latitude !== '' ? Number(profileData.latitude) : null,
        longitude: profileData.longitude !== undefined && profileData.longitude !== '' ? Number(profileData.longitude) : null,
        categories: Array.isArray(categories) ? categories : []
      });
      
      await supplierProfile.save();
      console.log('New supplier profile saved with ID:', supplierProfile._id);
      
      // Lier le profil à l'utilisateur
      user.supplierProfile = supplierProfile._id;
      await user.save();
      
    } else {
      console.log('Updating existing supplier profile');
      // Mettre à jour les champs existants
      if (profileData.companyName !== undefined) supplierProfile.companyName = profileData.companyName;
      if (profileData.companyPhone !== undefined) supplierProfile.phone = profileData.companyPhone;
      if (profileData.address !== undefined) supplierProfile.address = profileData.address;
      if (profileData.description !== undefined) supplierProfile.description = profileData.description;
      if (profileData.logo !== undefined) supplierProfile.logo = profileData.logo;
      if (profileData.city !== undefined) supplierProfile.city = profileData.city;
      if (profileData.latitude !== undefined) supplierProfile.latitude = profileData.latitude === '' ? null : Number(profileData.latitude);
      if (profileData.longitude !== undefined) supplierProfile.longitude = profileData.longitude === '' ? null : Number(profileData.longitude);
      if (categories !== undefined) {
        supplierProfile.categories = Array.isArray(categories) ? categories : [];
      }
      
      await supplierProfile.save();
      console.log('Supplier profile updated');
      
      // S'assurer que la référence existe
      if (!user.supplierProfile) {
        user.supplierProfile = supplierProfile._id;
        await user.save();
      }
    }
  }

  // Recharger l'utilisateur avec son profil
  const updatedUser = await User.findById(userId).populate('supplierProfile');
  console.log('Updated user with populated profile:', updatedUser ? updatedUser.email : 'Not found');
  console.log('Supplier profile:', updatedUser?.supplierProfile);
  
  return { ok: true, user: sanitizeUser(updatedUser) };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId);
  if (!user) {
    const e = new Error('Utilisateur introuvable'); e.statusCode = 404; throw e;
  }

  if (!newPassword || String(newPassword).length < 6) {
    const e = new Error('Le nouveau mot de passe doit contenir au moins 6 caractères'); e.statusCode = 400; throw e;
  }

  // If account already has local password, require current password
  if (user.password) {
    const ok = await bcrypt.compare(String(currentPassword || ''), user.password);
    if (!ok) {
      const e = new Error('Le mot de passe actuel est incorrect'); e.statusCode = 401; throw e;
    }
  }

  user.password = await bcrypt.hash(String(newPassword), 12);
  user.authProvider = user.authProvider || 'LOCAL';
  await user.save();
  return { ok: true };
}

function buildResetPasswordLink(token) {
  const base = process.env.APP_BASE_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
}

async function forgotPassword({ email }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    const e = new Error('Email requis'); e.statusCode = 400; throw e;
  }

  const user = await User.findOne({ email: cleanEmail });

  // ✅ Always return ok (security: don't leak if email exists)
  if (!user) {
    return { ok: true, message: 'Si cet email existe, un lien a été envoyé.' };
  }

  // optional: only allow for active users
  if (user.status && user.status !== 'ACTIVE') {
    return { ok: true, message: 'Si cet email existe, un lien a été envoyé.' };
  }

  const token = makeToken();
  user.resetPasswordTokenHash = hashToken(token);
  user.resetPasswordTokenExpiresAt = new Date(Date.now() + (Number(process.env.RESET_PWD_EXPIRES_MIN || 30) * 60 * 1000));
  await user.save();

  const link = buildResetPasswordLink(token);

  let devLink = null;
  if (isEmailConfigured()) {
    await sendMail({
      to: user.email,
      subject: 'Réinitialisation de mot de passe - BMP.tn',
      text: `Pour réinitialiser votre mot de passe, ouvrez ce lien: ${link}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 12px">Réinitialiser votre mot de passe</h2>
          <p>Pour continuer, cliquez sur le bouton ci-dessous.</p>
          <p style="margin:18px 0">
            <a href="${link}" style="background:#4338ca;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;display:inline-block">
              Réinitialiser le mot de passe
            </a>
          </p>
          <p style="color:#475569;font-size:13px">Si le bouton ne marche pas, copiez/collez ce lien :<br/>${link}</p>
        </div>
      `,
    });
  } else {
    devLink = link;
    console.log('[DEV] Reset password link:', devLink);
  }

  return { ok: true, message: 'Si cet email existe, un lien a été envoyé.', devLink };
}

async function resetPassword({ token, newPassword }) {
  const t = String(token || '').trim();
  const np = String(newPassword || '');

  if (!t) {
    const e = new Error('Token manquant'); e.statusCode = 400; throw e;
  }
  if (!np || np.length < 6) {
    const e = new Error('Le nouveau mot de passe doit contenir au moins 6 caractères'); e.statusCode = 400; throw e;
  }

  const tokenHash = hashToken(t);

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    const e = new Error('Token invalide ou expiré'); e.statusCode = 400; throw e;
  }

  user.password = await bcrypt.hash(np, 12);
  user.authProvider = user.authProvider || 'LOCAL';

  user.resetPasswordTokenHash = null;
  user.resetPasswordTokenExpiresAt = null;

  await user.save();

  return { ok: true, message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' };
}

async function phoneStart({ phone }) {
  const cleanPhone = String(phone || '').trim();
  if (!cleanPhone) {
    const e = new Error('Téléphone requis'); e.statusCode = 400; throw e;
  }

  const user = await User.findOne({ phone: cleanPhone });
  if (!user) {
    const e = new Error("Ce numéro de téléphone n’existe pas"); e.statusCode = 404; throw e;
  }

  if (user.status === 'BLOCKED') {
    const until = user.blockedUntil ? ` jusqu'au ${user.blockedUntil.toLocaleDateString('fr-TN')}` : '';
    const e = new Error(`Compte bloqué${until}`);
    e.statusCode = 403;
    throw e;
  }

  await startPhoneVerification(cleanPhone);
  return { ok: true, message: 'SMS envoyé' };
}

async function phoneVerify({ phone, code }) {
  const cleanPhone = String(phone || '').trim();
  const cleanCode = String(code || '').trim();
  if (!cleanPhone || !cleanCode) {
    const e = new Error('Le téléphone et le code sont requis'); e.statusCode = 400; throw e;
  }

  const user = await User.findOne({ phone: cleanPhone });
  if (!user) {
    const e = new Error("Ce numéro de téléphone n’existe pas"); e.statusCode = 404; throw e;
  }

  const check = await checkPhoneVerification(cleanPhone, cleanCode);
  if (check.status !== 'approved') {
    const e = new Error('Code invalide'); e.statusCode = 401; throw e;
  }

  // If user still needs to pick a role, issue a short-lived token
  if (user.role === REGISTER_ROLE) {
    const token = signJwt(user, { needsRole: true });
    return { token, user: sanitizeUser(user), needsRole: true };
  }

  const token = signJwt(user);
  return { token, user: sanitizeUser(user) };
}

async function setRole(userId, { role }) {
  if (!ROLE_ENUM.includes(role)) {
    const e = new Error('Rôle invalide'); e.statusCode = 400; throw e;
  }

  // SECURITY: Admin role cannot be self-assigned through any public flow.
  if (role === 'ADMIN') {
    const e = new Error('Rôle invalide'); e.statusCode = 400; throw e;
  }
  const user = await User.findById(userId);
  if (!user) {
    const e = new Error('Utilisateur introuvable'); e.statusCode = 404; throw e;
  }

  user.role = role;
  // If user came from a phone-first flow, ensure account is active
  if (!user.status) user.status = 'ACTIVE';
  await user.save();

  const token = signJwt(user);
  return { ok: true, token, user: sanitizeUser(user) };
}

module.exports = {
  register,
  login,
  me,
  verifyEmail,
  resendVerification,
  googleLogin,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  phoneStart,
  phoneVerify,
  setRole,
};