import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { urlRoleToEnum } from "../auth/role";
import { ArrowLeft, Building2, CheckCircle, ShieldCheck, UserPlus, XCircle } from "lucide-react";
import { useTranslation } from "../i18n";
import PublicNavbar from "../components/PublicNavbar";
import logo from "../assets/bmp-logo.svg";
import { useServerErrors } from "../hooks/useServerErrors";

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
        {t("registerForm.passwordStrength.strengthLabel")}{" "}
        <span className="font-medium text-slate-700">{labels[score - 1] ?? "—"}</span>
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
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Input({ label, placeholder, type = "text", value, onChange, error, hint }) {
  const hasError = Boolean(error);
  const isValid = !hasError && value.length > 0;
  return (
    <Field label={label} error={error} hint={hint}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
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
  const isValid = !hasError && phoneNumber.replace(/\s+/g, "").length >= 6;
  return (
    <Field label={label} error={error}>
      <div className="grid gap-3 sm:grid-cols-[180px,minmax(0,1fr)]">
        <select
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
        >
          {countries.map((c) => (
            <option key={c.value} value={c.value}>{t(c.labelKey)} ({c.value})</option>
          ))}
        </select>
        <input
          className={`h-11 rounded-xl border px-4 text-sm text-slate-900 outline-none transition ${
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
        />
      </div>
    </Field>
  );
}

const roleDetails = {
  artisan:      { icon: UserPlus,    title: "Artisan",      text: "Créez un compte professionnel pour gérer vos projets, devis et factures." },
  prescripteur: { icon: ShieldCheck, title: "Prescripteur", text: "Inscrivez-vous pour découvrir des artisans et des produits dans un parcours structuré." },
  fournisseur:  { icon: Building2,   title: "Fournisseur",  text: "Ouvrez votre compte fournisseur et gérez vos produits ainsi que vos commandes." },
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
  const { fieldErrors, globalError, handleError, clearErrors } = useServerErrors();

  async function onSubmit(e) {
    e.preventDefault();
    clearErrors();
    if (!roleEnum) {
      handleError(new Error(t("registerForm.errors.invalidRole") || "Rôle invalide"));
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
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40" />
        <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-400/10 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.25] [background-image:radial-gradient(circle,_#94a3b8_1px,_transparent_1px)] [background-size:28px_28px]" />

        <div className="relative z-10 w-full max-w-3xl">
          <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          <div className="rounded-b-3xl bg-white shadow-2xl shadow-indigo-200/40 ring-1 ring-slate-900/5">
            <div className="p-14">

              {/* Header */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-200">
                  <RoleIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">{t("registerForm.title") || "Créer votre compte"}</h1>
                  <p className="text-xs text-slate-500">{t("registerForm.subtitle")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 shrink-0"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Changer de rôle
                </button>
              </div>

              <form onSubmit={onSubmit} noValidate className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("registerForm.lastNameLabel")}
                    placeholder="Ben Salah"
                    value={lastName}
                    onChange={(v) => { setLastName(v); clearErrors(); }}
                    error={fieldErrors.lastName}
                  />
                  <Input
                    label={t("registerForm.firstNameLabel")}
                    placeholder="Mohamed"
                    value={firstName}
                    onChange={(v) => { setFirstName(v); clearErrors(); }}
                    error={fieldErrors.firstName}
                  />
                </div>

                <Input
                  label={t("registerForm.emailLabel")}
                  placeholder="mohamed@gmail.com"
                  type="email"
                  value={email}
                  onChange={(v) => { setEmail(v); clearErrors(); }}
                  error={fieldErrors.email}
                />

                <div>
                  <Input
                    label={t("registerForm.passwordLabel")}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(v) => { setPassword(v); clearErrors(); }}
                    error={fieldErrors.password}
                    hint={t("registerForm.passwordHint")}
                  />
                  <PasswordStrength password={password} />
                </div>

                <PhoneInput
                  label={t("registerForm.phoneLabel")}
                  countryCode={countryCode}
                  setCountryCode={setCountryCode}
                  phoneNumber={phoneNumber}
                  setPhoneNumber={(v) => { setPhoneNumber(v); clearErrors(); }}
                  error={fieldErrors.phoneNumber}
                />

                {globalError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {globalError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {t("registerForm.creatingButton")}
                      </>
                    ) : (
                      <>
                        {t("registerForm.submitButton")}
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </>
                    )}
                  </span>
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  {t("registerChooseRole.alreadyAccount")}{" "}
                  <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                    {t("registerChooseRole.loginLink")}
                  </Link>
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Link to="/terms" className="hover:text-slate-600">CGU</Link>
                  <span>·</span>
                  <Link to="/privacy" className="hover:text-slate-600">Confidentialité</Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2">
                <img src={logo} alt="BMP.tn" className="h-8 w-8 rounded-lg" />
                <span className="text-lg font-bold text-slate-900">BMP.tn</span>
              </div>
              <p className="mt-4 text-sm text-slate-600 max-w-md">
                La plateforme de référence en Tunisie pour connecter artisans, prescripteurs et fournisseurs.
              </p>
              <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} BMP.tn. Tous droits réservés.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">Plateforme</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/about" className="text-sm text-slate-600 transition-colors hover:text-blue-600">À propos</Link></li>
                <li><Link to="/how-it-works" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Comment ça marche</Link></li>
                <li><Link to="/pricing" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">Support</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/contact" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Contact</Link></li>
                <li><Link to="/privacy" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Politique de confidentialité</Link></li>
                <li><Link to="/terms" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Conditions d'utilisation</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
