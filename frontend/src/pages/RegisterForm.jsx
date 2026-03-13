import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { urlRoleToEnum } from "../auth/role";
import { CheckCircle, XCircle, ArrowLeft, UserPlus, ShieldCheck, Building2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import Footer from "../components/Footer";
import PublicNavbar from "../components/PublicNavbar";
import AuthShowcasePanel from "../components/AuthShowcasePanel";

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
    <div className="w-full">
      <label className="mb-2 block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
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
        className={`w-full rounded-xl sm:rounded-2xl border px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg focus:outline-none transition-colors ${
          hasError ? "border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-900/20 dark:border-red-600"
          : isValid ? "border-emerald-400 focus:border-emerald-500 dark:border-emerald-600"
          : "border-slate-200 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="h-12 sm:h-14 w-full sm:w-48 lg:w-64 rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 text-sm sm:text-base focus:outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
          className={`flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl border px-4 sm:px-5 text-base sm:text-lg placeholder:text-slate-400 focus:outline-none transition-colors ${
            hasError ? "border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-900/20 dark:border-red-600"
            : isValid ? "border-emerald-400 focus:border-emerald-500 dark:border-emerald-600"
            : "border-slate-200 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          }`}
          placeholder="Ex : 22 345 678"
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
        // company field removed
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
    <div className="min-h-screen bg-slate-100">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 lg:min-h-[760px] lg:grid-cols-[0.95fr,1.05fr]">
          <section className="relative flex flex-col bg-white px-6 py-7 sm:px-10 sm:py-8 lg:px-14 lg:py-10">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="mb-8 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
              <div className="mb-8 text-center">
                <p className="text-3xl font-semibold tracking-tight text-indigo-700">BMP.tn</p>
                <h1 className="mt-4 text-2xl font-semibold text-slate-900 sm:text-3xl">{t('registerForm.title') || "Create your account"}</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">{t('registerForm.subtitle')}</p>
              </div>

              <form onSubmit={onSubmit} noValidate className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                <div className="flex flex-col space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input
                      label={t('registerForm.lastNameLabel')}
                      placeholder="Ex : Ben Salah"
                      value={lastName}
                      onChange={(v) => { setLastName(v); clearError("lastName"); }}
                      error={errors.lastName}
                    />
                    <Input
                      label={t('registerForm.firstNameLabel')}
                      placeholder="Ex : Mohamed"
                      value={firstName}
                      onChange={(v) => { setFirstName(v); clearError("firstName"); }}
                      error={errors.firstName}
                    />
                  </div>

                  <Input
                    label={t('registerForm.emailLabel')}
                    placeholder="Ex : mohamed.bensalah@gmail.com"
                    type="email"
                    value={email}
                    onChange={(v) => { setEmail(v); clearError("email"); }}
                    error={errors.email}
                  />

                  <div>
                    <Input
                      label={t('registerForm.passwordLabel')}
                      type="password"
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(v) => { setPassword(v); clearError("password"); }}
                      error={errors.password}
                      hint={t('registerForm.passwordHint')}
                    />
                    <PasswordStrength password={password} />
                  </div>

                  <PhoneInput
                    label={t('registerForm.phoneLabel')}
                    countryCode={countryCode}
                    setCountryCode={setCountryCode}
                    phoneNumber={phoneNumber}
                    setPhoneNumber={(v) => { setPhoneNumber(v); clearError("phoneNumber"); }}
                    error={errors.phoneNumber}
                  />
                </div>

                {serverError && (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {serverError}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {loading ? t('registerForm.creatingButton') : t('registerForm.submitButton')}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <AuthShowcasePanel
            title="Create your BMP.tn account"
            description="Register with the same professional experience used across login and phone number access."
            items={[
              { icon: UserPlus, title: "Guided registration", text: "A clean sign up flow for new users joining the BMP.tn platform." },
              { icon: ShieldCheck, title: "Verified account access", text: "Use a valid email address and phone number to secure your account." },
              { icon: Building2, title: "Consistent platform design", text: "Register, sign in and phone verification now share the same official interface." },
            ]}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
