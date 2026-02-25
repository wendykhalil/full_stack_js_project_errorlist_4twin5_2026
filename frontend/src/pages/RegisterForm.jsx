import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { urlRoleToEnum } from "../auth/role";
import { CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "../components/LanguageSwitcher";

/* ── Password strength ── */
function PasswordStrength({ password }) {
  const { t } = useTranslation();
  if (!password) return null;
  const checks = [
    { label: t('registerForm.passwordStrength.minChars'), ok: password.length >= 8 },
    { label: t('registerForm.passwordStrength.uppercase'), ok: /[A-Z]/.test(password) },
    { label: t('registerForm.passwordStrength.number'), ok: /[0-9]/.test(password) },
    { label: t('registerForm.passwordStrength.special'), ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score  = checks.filter((c) => c.ok).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
  const labels = [
    t('registerForm.passwordStrength.veryWeak'),
    t('registerForm.passwordStrength.weak'),
    t('registerForm.passwordStrength.medium'),
    t('registerForm.passwordStrength.strong')
  ];
  const bar    = colors[score - 1] ?? "bg-slate-200";

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? bar : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {t('registerForm.passwordStrength.strengthLabel')}{" "}
        <span className="font-medium">{labels[score - 1] ?? "—"}</span>
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
        {checks.map((c) => (
          <span key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? "text-emerald-600" : "text-slate-400"}`}>
            {c.ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="mb-2 block text-base font-medium text-slate-700">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ── Input ── */
function Input({ label, placeholder, type = "text", value, onChange, error, hint, required = true }) {
  const hasError = Boolean(error);
  const isValid  = !hasError && value.length > 0;
  return (
    <Field label={label} error={error} hint={hint}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-2xl border px-5 py-4 text-lg focus:outline-none transition-colors ${
          hasError ? "border-red-400 bg-red-50 focus:border-red-500"
          : isValid ? "border-emerald-400 focus:border-emerald-500"
          : "border-slate-200 focus:border-indigo-500"
        }`}
      />
    </Field>
  );
}

/* ── Phone input ── */
function PhoneInput({ label, countryCode, setCountryCode, phoneNumber, setPhoneNumber, error }) {
  const { t } = useTranslation();

  // Liste des pays avec clés de traduction
  const countries = [
    { value: "+216", labelKey: "countries.tn" },
    { value: "+213", labelKey: "countries.dz" },
    { value: "+212", labelKey: "countries.ma" },
    { value: "+218", labelKey: "countries.ly" },
    { value: "+20",  labelKey: "countries.eg" },
    { value: "+222", labelKey: "countries.mr" },
    { value: "+221", labelKey: "countries.sn" },
    { value: "+225", labelKey: "countries.ci" },
    { value: "+234", labelKey: "countries.ng" },
    { value: "+33",  labelKey: "countries.fr" },
    { value: "+32",  labelKey: "countries.be" },
    { value: "+41",  labelKey: "countries.ch" },
    { value: "+352", labelKey: "countries.lu" },
    { value: "+49",  labelKey: "countries.de" },
    { value: "+39",  labelKey: "countries.it" },
    { value: "+34",  labelKey: "countries.es" },
    { value: "+351", labelKey: "countries.pt" },
    { value: "+31",  labelKey: "countries.nl" },
    { value: "+44",  labelKey: "countries.uk" },
    { value: "+971", labelKey: "countries.ae" },
    { value: "+966", labelKey: "countries.sa" },
    { value: "+974", labelKey: "countries.qa" },
    { value: "+965", labelKey: "countries.kw" },
    { value: "+961", labelKey: "countries.lb" },
    { value: "+1",   labelKey: "countries.us" },
    { value: "+52",  labelKey: "countries.mx" },
    { value: "+55",  labelKey: "countries.br" },
    { value: "+91",  labelKey: "countries.in" },
    { value: "+86",  labelKey: "countries.cn" },
    { value: "+81",  labelKey: "countries.jp" },
    { value: "+61",  labelKey: "countries.au" },
  ];

  const hasError = Boolean(error);
  const isValid  = !hasError && phoneNumber.replace(/\s+/g, "").length >= 6;

  return (
    <Field label={label} error={error}>
      <div className="flex gap-3">
        <select
          className="h-14 w-64 rounded-2xl border border-slate-200 bg-white px-4 text-base focus:outline-none focus:border-indigo-500"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
        >
          {countries.map((c) => (
            <option key={c.value} value={c.value}>
              {t(c.labelKey)} ({c.value})
            </option>
          ))}
        </select>
        <input
          className={`flex-1 h-14 rounded-2xl border px-5 text-lg placeholder:text-slate-400 focus:outline-none transition-colors ${
            hasError ? "border-red-400 bg-red-50 focus:border-red-500"
            : isValid ? "border-emerald-400 focus:border-emerald-500"
            : "border-slate-200 focus:border-indigo-500"
          }`}
          placeholder={t('registerForm.phonePlaceholder')}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ""))}
          inputMode="tel"
          required
        />
      </div>
    </Field>
  );
}

/* ── Main ── */
export default function RegisterForm() {
  const { t } = useTranslation();
  const { role: roleParam } = useParams();
  const navigate = useNavigate();
  const { register } = useAuth();

  const roleEnum = useMemo(() => urlRoleToEnum(roleParam), [roleParam]);

  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [countryCode, setCountryCode] = useState("+216");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [company,     setCompany]     = useState("");
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState("");

  // Validation améliorée avec messages plus clairs
  function validate() {
    const errors = {};

    // Validation Nom
    if (!lastName.trim()) {
      errors.lastName = t('registerForm.errors.lastNameRequired') || "Le nom est requis";
    } else if (lastName.trim().length < 2) {
      errors.lastName = t('registerForm.errors.lastNameMin') || "Le nom doit contenir au moins 2 caractères";
    } else if (lastName.trim().length > 60) {
      errors.lastName = t('registerForm.errors.lastNameMax') || "Le nom ne peut pas dépasser 60 caractères";
    }

    // Validation Prénom
    if (!firstName.trim()) {
      errors.firstName = t('registerForm.errors.firstNameRequired') || "Le prénom est requis";
    } else if (firstName.trim().length < 2) {
      errors.firstName = t('registerForm.errors.firstNameMin') || "Le prénom doit contenir au moins 2 caractères";
    } else if (firstName.trim().length > 60) {
      errors.firstName = t('registerForm.errors.firstNameMax') || "Le prénom ne peut pas dépasser 60 caractères";
    }

    // Validation Email
    if (!email.trim()) {
      errors.email = t('registerForm.errors.emailRequired') || "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = t('registerForm.errors.emailInvalid') || "Format d'email invalide (ex: nom@domaine.com)";
    }

    // Validation Mot de passe
    if (!password) {
      errors.password = t('registerForm.errors.passwordRequired') || "Le mot de passe est requis";
    } else if (password.length < 8) {
      errors.password = t('registerForm.errors.passwordMin') || "Le mot de passe doit contenir au moins 8 caractères";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = t('registerForm.errors.passwordUppercase') || "Le mot de passe doit contenir au moins une majuscule";
    } else if (!/[0-9]/.test(password)) {
      errors.password = t('registerForm.errors.passwordNumber') || "Le mot de passe doit contenir au moins un chiffre";
    }

    // Validation Téléphone
    const cleaned = phoneNumber.replace(/\s+/g, "");
    if (!cleaned) {
      errors.phoneNumber = t('registerForm.errors.phoneRequired') || "Le numéro de téléphone est requis";
    } else if (!/^\d{6,14}$/.test(cleaned)) {
      errors.phoneNumber = t('registerForm.errors.phoneInvalid') || "Le numéro de téléphone doit contenir entre 6 et 14 chiffres";
    }

    // ✅ VALIDATION AMÉLIORÉE: Entreprise (optionnel mais avec messages clairs)
    const companyTrimmed = company.trim();
    if (companyTrimmed) {
      if (companyTrimmed.length < 2) {
        errors.company = t('registerForm.errors.companyMin') || "Le nom de l'entreprise doit contenir au moins 2 caractères";
      } else if (companyTrimmed.length > 100) {
        errors.company = t('registerForm.errors.companyMax') || "Le nom de l'entreprise ne peut pas dépasser 100 caractères";
      }
    }
    // Si companyTrimmed est vide, pas d'erreur (champ optionnel)

    return errors;
  }

  function clearError(field) {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError("");

    if (!roleEnum) { 
      setServerError(t('registerForm.errors.invalidRole') || "Rôle invalide"); 
      return; 
    }

    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        password,
        phone:     `${countryCode}${phoneNumber.replace(/\s+/g, "").trim()}`,
        role:      roleEnum,
        company:   company.trim() || undefined, // Envoyer undefined si vide
      });
      navigate("/login", {
        replace: true,
        state: { info: t('registerForm.successMessage') || "Inscription réussie ! Vous pouvez maintenant vous connecter." },
      });
    } catch (err) {
      setServerError(err.message || t('registerForm.errors.registerError') || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Language Switcher - fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <form
          onSubmit={onSubmit}
          noValidate
          className="w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-12"
        >
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{t('registerForm.title')}</h1>
            <p className="mt-1 text-lg text-slate-500">{t('registerForm.subtitle')}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Nom */}
            <Input
              label={t('registerForm.lastNameLabel')}
              placeholder={t('registerForm.lastNamePlaceholder')}
              value={lastName}
              onChange={(v) => { setLastName(v); clearError("lastName"); }}
              error={errors.lastName}
            />

            {/* Prénom */}
            <Input
              label={t('registerForm.firstNameLabel')}
              placeholder={t('registerForm.firstNamePlaceholder')}
              value={firstName}
              onChange={(v) => { setFirstName(v); clearError("firstName"); }}
              error={errors.firstName}
            />

            {/* Email */}
            <Input
              label={t('registerForm.emailLabel')}
              placeholder={t('registerForm.emailPlaceholder')}
              type="email"
              value={email}
              onChange={(v) => { setEmail(v); clearError("email"); }}
              error={errors.email}
            />

            {/* Mot de passe + strength */}
            <div>
              <Input
                label={t('registerForm.passwordLabel')}
                type="password"
                placeholder={t('registerForm.passwordPlaceholder')}
                value={password}
                onChange={(v) => { setPassword(v); clearError("password"); }}
                error={errors.password}
                hint={t('registerForm.passwordHint')}
              />
              <PasswordStrength password={password} />
            </div>

            {/* Téléphone */}
            <div className="lg:col-span-2">
              <PhoneInput
                label={t('registerForm.phoneLabel')}
                countryCode={countryCode}
                setCountryCode={setCountryCode}
                phoneNumber={phoneNumber}
                setPhoneNumber={(v) => { setPhoneNumber(v); clearError("phoneNumber"); }}
                error={errors.phoneNumber}
              />
            </div>

            {/* ✅ Entreprise (optionnel mais validé) */}
            <div className="lg:col-span-3">
              <Input
                label={t('registerForm.companyLabel')}
                placeholder={t('registerForm.companyPlaceholder')}
                value={company}
                onChange={(v) => { setCompany(v); clearError("company"); }}
                required={false}
                error={errors.company}
                hint={t('registerForm.companyHint') || "Optionnel - Si vous saisissez une entreprise, minimum 2 caractères"}
              />
            </div>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl border border-slate-200 py-4 text-lg font-semibold hover:bg-slate-50"
            >
              {t('registerForm.backButton')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-indigo-700 py-4 text-lg font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
            >
              {loading ? t('registerForm.creatingButton') : t('registerForm.submitButton')}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}