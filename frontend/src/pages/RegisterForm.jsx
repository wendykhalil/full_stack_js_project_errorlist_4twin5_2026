import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export default function RegisterForm() {
  const { role } = useParams();   // ← get role from URL
  const navigate = useNavigate();

  const isArtisan = role === "artisan";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Créer un compte
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Complétez vos informations
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Input label="Nom complet" placeholder="Jean Dupont" />
          <Input label="Email" placeholder="jean@example.com" />

          <Input label="Mot de passe" type="password" placeholder="••••••••" />
          <Input label="Téléphone" placeholder="+216 XX XXX XXX" />
        </div>

        <div className="mt-6">
          <Input label="Entreprise" placeholder="Nom de votre entreprise" />
        </div>

        {/* ✅ ONLY FOR ARTISAN */}
        {isArtisan && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Select label="Spécialité" />
            <Select label="Région" />
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 rounded-xl border border-slate-200 py-3 font-medium"
          >
            Retour
          </button>

          <button className="flex-1 rounded-xl bg-indigo-700 py-3 font-semibold text-white hover:bg-indigo-800">
            Créer mon compte
          </button>
        </div>
      </div>
    </main>
  );
}

/* ---------------- Components ---------------- */

const Input = ({ label, placeholder, type = "text" }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
    />
  </div>
);

const Select = ({ label }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {label}
    </label>
    <div className="relative">
      <select className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none">
        <option>Sélectionner...</option>
      </select>
      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  </div>
);
