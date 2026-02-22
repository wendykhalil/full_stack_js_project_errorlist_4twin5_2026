import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { HardHat, User, Package, Shield } from "lucide-react";

const RoleCard = ({ icon, title, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="flex items-start justify-between">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-indigo-700">
        {icon}
      </div>
    </div>

    <div className="mt-6 text-lg font-semibold text-slate-900">{title}</div>
    <div className="mt-2 text-sm text-slate-500">{desc}</div>
  </button>
);

export default function RegisterChooseRole() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16">
        {/* Logo */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-700 text-white">
          <HardHat className="h-6 w-6" />
        </div>

        <h1 className="mt-6 text-3xl font-semibold text-slate-900">Créer un compte</h1>
        <p className="mt-2 text-sm text-slate-500">Choisissez votre profil</p>

        <div className="mt-10 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          <RoleCard
            icon={<HardHat className="h-6 w-6" />}
            title="Artisan"
            desc="Gérer vos projets, devis et factures"
            onClick={() => navigate("/register/artisan")}
          />
          <RoleCard
            icon={<User className="h-6 w-6" />}
            title="Prescriber"
            desc="Découvrir des produits et trouver des artisans"
            onClick={() => navigate("/register/prescripteur")}
          />
          <RoleCard
            icon={<Package className="h-6 w-6" />}
            title="Supplier"
            desc="Gérer votre catalogue de produits"
            onClick={() => navigate("/register/fournisseur")}
          />
          <RoleCard
            icon={<Shield className="h-6 w-6" />}
            title="Admin"
            desc="Administrer la plateforme"
            onClick={() => navigate("/register/admin")}
          />
        </div>

        <div className="mt-10 text-sm text-slate-500">
          Vous avez déjà un compte?{" "}
          <Link to="/login" className="font-semibold text-indigo-700 hover:underline">
            Se connecter
          </Link>
        </div>
      </main>
    </div>
  );
}
