import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { urlRoleToEnum } from "../auth/role";
import { CheckCircle, XCircle } from "lucide-react";

/* ── Validation ── */
function validate({ firstName, lastName, email, password, phoneNumber }) {
  const errors = {};

  if (!lastName.trim() || lastName.trim().length < 2)
    errors.lastName = "Au moins 2 caractères.";
  else if (lastName.trim().length > 60)
    errors.lastName = "Maximum 60 caractères.";

  if (!firstName.trim() || firstName.trim().length < 2)
    errors.firstName = "Au moins 2 caractères.";
  else if (firstName.trim().length > 60)
    errors.firstName = "Maximum 60 caractères.";

  if (!email.trim())
    errors.email = "L'email est requis.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = "Adresse email invalide.";

  if (!password)
    errors.password = "Le mot de passe est requis.";
  else if (password.length < 8)
    errors.password = "Au moins 8 caractères.";
  else if (!/[A-Z]/.test(password))
    errors.password = "Au moins une majuscule.";
  else if (!/[0-9]/.test(password))
    errors.password = "Au moins un chiffre.";

  const cleaned = phoneNumber.replace(/\s+/g, "");
  if (!cleaned)
    errors.phoneNumber = "Le numéro est requis.";
  else if (!/^\d{6,14}$/.test(cleaned))
    errors.phoneNumber = "Entre 6 et 14 chiffres.";

  return errors;
}

/* ── Password strength ── */
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: "8 caractères min.", ok: password.length >= 8 },
    { label: "Majuscule",         ok: /[A-Z]/.test(password) },
    { label: "Chiffre",           ok: /[0-9]/.test(password) },
    { label: "Caractère spécial", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score  = checks.filter((c) => c.ok).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
  const labels = ["Très faible", "Faible", "Moyen", "Fort"];
  const bar    = colors[score - 1] ?? "bg-slate-200";

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? bar : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Force : <span className="font-medium">{labels[score - 1] ?? "—"}</span>
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
      {error           && <p className="mt-1 text-xs text-red-600">{error}</p>}
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
  const codes = [
    { value: "+216", label: "🇹🇳 Tunisie (+216)" },
    { value: "+213", label: "🇩🇿 Algérie (+213)" },
    { value: "+212", label: "🇲🇦 Maroc (+212)" },
    { value: "+218", label: "🇱🇾 Libye (+218)" },
    { value: "+20",  label: "🇪🇬 Égypte (+20)" },
    { value: "+222", label: "🇲🇷 Mauritanie (+222)" },
    { value: "+221", label: "🇸🇳 Sénégal (+221)" },
    { value: "+225", label: "🇨🇮 Côte d'Ivoire (+225)" },
    { value: "+234", label: "🇳🇬 Nigeria (+234)" },
    { value: "+33",  label: "🇫🇷 France (+33)" },
    { value: "+32",  label: "🇧🇪 Belgique (+32)" },
    { value: "+41",  label: "🇨🇭 Suisse (+41)" },
    { value: "+352", label: "🇱🇺 Luxembourg (+352)" },
    { value: "+49",  label: "🇩🇪 Allemagne (+49)" },
    { value: "+39",  label: "🇮🇹 Italie (+39)" },
    { value: "+34",  label: "🇪🇸 Espagne (+34)" },
    { value: "+351", label: "🇵🇹 Portugal (+351)" },
    { value: "+31",  label: "🇳🇱 Pays-Bas (+31)" },
    { value: "+44",  label: "🇬🇧 Royaume-Uni (+44)" },
    { value: "+971", label: "🇦🇪 Émirats (+971)" },
    { value: "+966", label: "🇸🇦 Arabie Saoudite (+966)" },
    { value: "+974", label: "🇶🇦 Qatar (+974)" },
    { value: "+965", label: "🇰🇼 Koweït (+965)" },
    { value: "+961", label: "🇱🇧 Liban (+961)" },
    { value: "+1",   label: "🇺🇸 États-Unis (+1)" },
    { value: "+52",  label: "🇲🇽 Mexique (+52)" },
    { value: "+55",  label: "🇧🇷 Brésil (+55)" },
    { value: "+91",  label: "🇮🇳 Inde (+91)" },
    { value: "+86",  label: "🇨🇳 Chine (+86)" },
    { value: "+81",  label: "🇯🇵 Japon (+81)" },
    { value: "+61",  label: "🇦🇺 Australie (+61)" },
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
          {codes.map((c) => (
            <option key={c.label} value={c.value}>{c.label}</option>
          ))}
        </select>
        <input
          className={`flex-1 h-14 rounded-2xl border px-5 text-lg placeholder:text-slate-400 focus:outline-none transition-colors ${
            hasError ? "border-red-400 bg-red-50 focus:border-red-500"
            : isValid ? "border-emerald-400 focus:border-emerald-500"
            : "border-slate-200 focus:border-indigo-500"
          }`}
          placeholder="Votre numéro"
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

  function clearError(field) {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError("");

    if (!roleEnum) { setServerError("Rôle invalide"); return; }

    const fieldErrors = validate({ firstName, lastName, email, password, phoneNumber });
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
      });
      navigate("/login", {
        replace: true,
        state: { info: "Compte créé. Vérifiez votre email pour confirmer, puis connectez-vous." },
      });
    } catch (err) {
      setServerError(err.message || "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-12"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Créer un compte</h1>
          <p className="mt-1 text-lg text-slate-500">Complétez vos informations</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Nom */}
          <Input
            label="Nom"
            placeholder="Dupont"
            value={lastName}
            onChange={(v) => { setLastName(v); clearError("lastName"); }}
            error={errors.lastName}
          />

          {/* Prénom */}
          <Input
            label="Prénom"
            placeholder="Jean"
            value={firstName}
            onChange={(v) => { setFirstName(v); clearError("firstName"); }}
            error={errors.firstName}
          />

          {/* Email */}
          <Input
            label="Email"
            placeholder="jean@example.com"
            type="email"
            value={email}
            onChange={(v) => { setEmail(v); clearError("email"); }}
            error={errors.email}
          />

          {/* Mot de passe + strength */}
          <div>
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(v) => { setPassword(v); clearError("password"); }}
              error={errors.password}
              hint="8 caractères min., une majuscule et un chiffre."
            />
            <PasswordStrength password={password} />
          </div>

          {/* Téléphone */}
          <div className="lg:col-span-2">
            <PhoneInput
              label="Téléphone"
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              phoneNumber={phoneNumber}
              setPhoneNumber={(v) => { setPhoneNumber(v); clearError("phoneNumber"); }}
              error={errors.phoneNumber}
            />
          </div>

          {/* Entreprise (optionnel) */}
          <div className="lg:col-span-3">
            <Input
              label="Entreprise (optionnel)"
              placeholder="Nom de votre entreprise"
              value={company}
              onChange={setCompany}
              required={false}
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
            Retour
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-2xl bg-indigo-700 py-4 text-lg font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </div>
      </form>
    </main>
  );
}