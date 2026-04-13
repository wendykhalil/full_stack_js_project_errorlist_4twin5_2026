import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { urlRoleToEnum } from "../auth/role";
import { ArrowLeft, Building2, CheckCircle, ShieldCheck, UserPlus, XCircle } from "lucide-react";
import { useTranslation } from "../i18n";
import Footer from "../components/Footer";
import PublicNavbar from "../components/PublicNavbar";
import logo from "../assets/bmp-logo.svg";

function PasswordStrength({ password }) {
  const { t } = useTranslation();
  if (!password) return null;
  const checks = [
    { label: t("registerForm.passwordStrength.minChars"), ok: password.length >= 8 },
    { label: t("registerForm.passwordStrength.uppercase"), ok: /[A-Z]/.test(password) },
    { label: t("registerForm.passwordStrength.number"), ok: /[0-9]/.test(password) },
    { label: t("registerForm.passwordStrength.special"), ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-rose-400", "bg-sky-400", "bg-blue-500", "bg-emerald-500"];
  const labels = [
    t("registerForm.passwordStrength.veryWeak"),
    t("registerForm.passwordStrength.weak"),
    t("registerForm.passwordStrength.medium"),
    t("registerForm.passwordStrength.strong"),
  ];
  const bar = colors[score - 1] ?? "bg-slate-200";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? bar : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {t("registerForm.passwordStrength.strengthLabel")} <span className="font-medium text-slate-700">{labels[score - 1] ?? "—"}</span>
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
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

function Field({ label, error, hint, children }) {
  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Input({ label, placeholder, type = "text", value, onChange, error, hint, required = true }) {
  const hasError = Boolean(error);
  const isValid = !hasError && value.length > 0;
  return (
    <Field label={label} error={error} hint={hint}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-xl border px-4 py-3 text-base text-slate-900 outline-none transition ${
          hasError
            ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100"
            : isValid
              ? "border-emerald-300 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              : "border-slate-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        }`}
      />
    </Field>
  );
}

function PhoneInput({ label, countryCode, setCountryCode, phoneNumber, setPhoneNumber, error }) {
  const { t } = useTranslation();

  const countries = [
    { value: "+216", labelKey: "countries.tn" },
    { value: "+213", labelKey: "countries.dz" },
    { value: "+212", labelKey: "countries.ma" },
    { value: "+218", labelKey: "countries.ly" },
    { value: "+20", labelKey: "countries.eg" },
    { value: "+222", labelKey: "countries.mr" },
    { value: "+221", labelKey: "countries.sn" },
    { value: "+225", labelKey: "countries.ci" },
    { value: "+234", labelKey: "countries.ng" },
    { value: "+33", labelKey: "countries.fr" },
    { value: "+32", labelKey: "countries.be" },
    { value: "+41", labelKey: "countries.ch" },
    { value: "+352", labelKey: "countries.lu" },
    { value: "+49", labelKey: "countries.de" },
    { value: "+39", labelKey: "countries.it" },
    { value: "+34", labelKey: "countries.es" },
    { value: "+351", labelKey: "countries.pt" },
    { value: "+31", labelKey: "countries.nl" },
    { value: "+44", labelKey: "countries.uk" },
    { value: "+971", labelKey: "countries.ae" },
    { value: "+966", labelKey: "countries.sa" },
    { value: "+974", labelKey: "countries.qa" },
    { value: "+965", labelKey: "countries.kw" },
    { value: "+961", labelKey: "countries.lb" },
    { value: "+1", labelKey: "countries.us" },
    { value: "+52", labelKey: "countries.mx" },
    { value: "+55", labelKey: "countries.br" },
    { value: "+91", labelKey: "countries.in" },
    { value: "+86", labelKey: "countries.cn" },
    { value: "+81", labelKey: "countries.jp" },
    { value: "+61", labelKey: "countries.au" },
  ];

  const hasError = Boolean(error);
  const isValid = !hasError && phoneNumber.replace(/\s+/g, "").length >= 6;

  return (
    <Field label={label} error={error}>
      <div className="grid gap-3 sm:grid-cols-[180px,minmax(0,1fr)]">
        <select
          className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
          className={`h-12 rounded-xl border px-4 text-base text-slate-900 outline-none transition ${
            hasError
              ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              : isValid
                ? "border-emerald-300 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                : "border-slate-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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

const roleDetails = {
  artisan: { icon: UserPlus, title: "Artisan", text: "Create a professional account to manage projects, quotes and invoices." },
  prescripteur: { icon: ShieldCheck, title: "Prescripteur", text: "Register to discover artisans and products in a structured workflow." },
  fournisseur: { icon: Building2, title: "Fournisseur", text: "Open your supplier account and manage products and incoming orders." },
  admin: { icon: ShieldCheck, title: "Admin", text: "Set up an internal administration account with the same secure registration flow." },
};

export default function RegisterForm() {
  const { t } = useTranslation();
  const { role: roleParam } = useParams();
  const navigate = useNavigate();
  const { register } = useAuth();
  const roleEnum = useMemo(() => urlRoleToEnum(roleParam), [roleParam]);
  const roleMeta = roleDetails[roleParam] ?? roleDetails.artisan;
  const RoleIcon = roleMeta.icon;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+216");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  function validate() {
    const errors = {};

    if (!lastName.trim()) {
      errors.lastName = t("registerForm.errors.lastNameRequired") || "Le nom est requis";
    } else if (lastName.trim().length < 2) {
      errors.lastName = t("registerForm.errors.lastNameMin") || "Le nom doit contenir au moins 2 caractères";
    } else if (lastName.trim().length > 60) {
      errors.lastName = t("registerForm.errors.lastNameMax") || "Le nom ne peut pas dépasser 60 caractères";
    }

    if (!firstName.trim()) {
      errors.firstName = t("registerForm.errors.firstNameRequired") || "Le prénom est requis";
    } else if (firstName.trim().length < 2) {
      errors.firstName = t("registerForm.errors.firstNameMin") || "Le prénom doit contenir au moins 2 caractères";
    } else if (firstName.trim().length > 60) {
      errors.firstName = t("registerForm.errors.firstNameMax") || "Le prénom ne peut pas dépasser 60 caractères";
    }

    if (!email.trim()) {
      errors.email = t("registerForm.errors.emailRequired") || "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = t("registerForm.errors.emailInvalid") || "Format d'email invalide (ex: nom@domaine.com)";
    }

    if (!password) {
      errors.password = t("registerForm.errors.passwordRequired") || "Le mot de passe est requis";
    } else if (password.length < 8) {
      errors.password = t("registerForm.errors.passwordMin") || "Le mot de passe doit contenir au moins 8 caractères";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = t("registerForm.errors.passwordUppercase") || "Le mot de passe doit contenir au moins une majuscule";
    } else if (!/[0-9]/.test(password)) {
      errors.password = t("registerForm.errors.passwordNumber") || "Le mot de passe doit contenir au moins un chiffre";
    }

    const cleaned = phoneNumber.replace(/\s+/g, "");
    if (!cleaned) {
      errors.phoneNumber = t("registerForm.errors.phoneRequired") || "Le numéro de téléphone est requis";
    } else if (!/^\d{6,14}$/.test(cleaned)) {
      errors.phoneNumber = t("registerForm.errors.phoneInvalid") || "Le numéro de téléphone doit contenir entre 6 et 14 chiffres";
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
      setServerError(t("registerForm.errors.invalidRole") || "Rôle invalide");
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
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phone: `${countryCode}${phoneNumber.replace(/\s+/g, "").trim()}`,
        role: roleEnum,
      });
      navigate("/login", {
        replace: true,
        state: { info: t("registerForm.successMessage") || "Inscription réussie ! Vous pouvez maintenant vous connecter." },
      });
    } catch (err) {
      setServerError(err.message || t("registerForm.errors.registerError") || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.12),_transparent_24%)]" />

        <div className="relative z-10 w-full max-w-3xl">
          <div className="mx-auto max-w-xl text-center">
            <img src={logo} alt="BMP.tn logo" className="mx-auto h-12 w-12 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" />
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t("registerForm.title") || "Create your account"}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">{t("registerForm.subtitle")}</p>
          </div>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70 sm:p-7 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <RoleIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Selected role</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{roleMeta.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{roleMeta.text}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Change role
              </button>
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label={t("registerForm.lastNameLabel")}
                  placeholder="Ex : Ben Salah"
                  value={lastName}
                  onChange={(v) => {
                    setLastName(v);
                    clearError("lastName");
                  }}
                  error={errors.lastName}
                />
                <Input
                  label={t("registerForm.firstNameLabel")}
                  placeholder="Ex : Mohamed"
                  value={firstName}
                  onChange={(v) => {
                    setFirstName(v);
                    clearError("firstName");
                  }}
                  error={errors.firstName}
                />
              </div>

              <Input
                label={t("registerForm.emailLabel")}
                placeholder="Ex : mohamed.bensalah@gmail.com"
                type="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  clearError("email");
                }}
                error={errors.email}
              />

              <div>
                <Input
                  label={t("registerForm.passwordLabel")}
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
                    clearError("password");
                  }}
                  error={errors.password}
                  hint={t("registerForm.passwordHint")}
                />
                <PasswordStrength password={password} />
              </div>

              <PhoneInput
                label={t("registerForm.phoneLabel")}
                countryCode={countryCode}
                setCountryCode={setCountryCode}
                phoneNumber={phoneNumber}
                setPhoneNumber={(v) => {
                  setPhoneNumber(v);
                  clearError("phoneNumber");
                }}
                error={errors.phoneNumber}
              />

              {serverError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {loading ? t("registerForm.creatingButton") : t("registerForm.submitButton")}
              </button>
            </form>
          </div>

          <div className="mt-5 text-center text-sm text-slate-500">
            {t("registerChooseRole.alreadyAccount")} {" "}
            <Link to="/login" className="font-semibold text-slate-900 transition hover:text-blue-700 hover:underline">
              {t("registerChooseRole.loginLink")}
            </Link>
          </div>
        </div>
      </main>

      <Footer compact />
    </div>
  );
}
