import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Upload, FileText, Plus, Package, ShoppingCart, TrendingUp } from "lucide-react";

const StatCard = ({ title, value, icon, iconBg, iconFg }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
    </div>
  </div>
);

const Input = ({ label, placeholder, type = "text" }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
    />
  </div>
);

const Select = ({ label, placeholder }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <div className="relative">
      <select className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none">
        <option>{placeholder}</option>
        <option>Matériaux de base</option>
        <option>Revêtements</option>
        <option>Peinture</option>
        <option>Menuiserie</option>
        <option>Électricité</option>
        <option>Sanitaire</option>
      </select>
      <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  </div>
);

const Textarea = ({ label, placeholder }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <textarea
      rows={4}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
    />
  </div>
);

const UploadBox = ({ title, subtitle, icon }) => (
  <div>
    <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
    <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center hover:bg-slate-50">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-600">{subtitle}</div>
      <input type="file" className="hidden" />
    </label>
  </div>
);

export default function FournisseurProduitNew() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Title + CTA (same header space) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Gestion des Produits
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gérez votre catalogue de produits et équipements
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800">
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </button>
      </div>

      {/* Stats stay visible (like screenshot) */}
      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Produits actifs" value="42" icon={<Package />} iconBg="bg-indigo-50" iconFg="text-indigo-600" />
        <StatCard title="Commandes ce mois" value="127" icon={<ShoppingCart />} iconBg="bg-emerald-50" iconFg="text-emerald-600" />
        <StatCard title="Chiffre d'affaires" value="45,280 TND" icon={<TrendingUp />} iconBg="bg-orange-50" iconFg="text-orange-600" />
        <StatCard title="Catalogues" value="3" icon={<FileText />} iconBg="bg-slate-100" iconFg="text-slate-700" />
      </section>

      {/* Form card */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Ajouter un nouveau produit</h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Input label="Nom du produit" placeholder="Ex: Ciment CEM II 42.5" />
          <Select label="Catégorie" placeholder="Sélectionner..." />

          <Input label="Prix unitaire (TND)" placeholder="0.00" type="number" />
          <Select label="Unité" placeholder="Sélectionner..." />

          <Input label="Stock disponible" placeholder="0" type="number" />
          <div /> {/* spacer to align grid */}
        </div>

        <div className="mt-6">
          <Textarea label="Description" placeholder="Description détaillée du produit..." />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <UploadBox
            title="Image du produit"
            subtitle="Cliquez pour télécharger une image"
            icon={<Upload className="h-5 w-5" />}
          />
          <UploadBox
            title="Fiche technique (PDF)"
            subtitle="Cliquez pour télécharger un PDF"
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        {/* Bottom buttons */}
        <div className="mt-8 flex flex-col gap-4 md:flex-row">
          <button
            onClick={() => navigate("/fournisseur/produits")}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Annuler
          </button>

          <button
            onClick={() => navigate("/fournisseur/produits")}
            className="flex-1 rounded-2xl bg-indigo-700 py-4 text-sm font-semibold text-white hover:bg-indigo-800"
          >
            Ajouter le produit
          </button>
        </div>
      </section>
    </main>
  );
}
