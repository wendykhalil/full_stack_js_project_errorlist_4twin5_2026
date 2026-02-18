import React from "react";
import { Search, ChevronDown, FileText } from "lucide-react";

const Card = ({ cat, title, desc, supplier, price, unit }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
      {cat}
    </span>

    <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{desc}</p>

    <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
      <FileText className="h-4 w-4 text-slate-400" />
      {supplier}
    </div>

    <div className="mt-6 flex items-end justify-between">
      <div>
        <div className="text-xl font-semibold text-indigo-700">{price} TND</div>
        <div className="text-xs text-slate-500">{unit}</div>
      </div>

      <button className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
        Détails
      </button>
    </div>
  </div>
);

export default function PrescripteurProduits() {
  return (
    <main className="mx-auto max-w-6xl py-10">
      <h1 className="text-3xl font-semibold text-slate-900">
        Catalogue de Produits
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Découvrez notre sélection de matériaux et équipements
      </p>

      {/* Search / filter */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Rechercher des produits..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="relative w-full md:w-64">
            <select className="w-full appearance-none rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none">
              <option>Toutes catégories</option>
              <option>Matériaux de base</option>
              <option>Revêtements</option>
              <option>Peinture</option>
              <option>Menuiserie</option>
              <option>Électricité</option>
              <option>Sanitaire</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card
          cat="Matériaux de base"
          title="Ciment CEM II 42.5"
          desc="Ciment haute résistance pour tous travaux"
          supplier="BatiMat Tunisie"
          price="12.50"
          unit="par sac 50kg"
        />
        <Card
          cat="Revêtements"
          title="Carrelage Porcelaine 60x60"
          desc="Carrelage aspect marbre blanc"
          supplier="Céramique Tunisie"
          price="25.00"
          unit="par m²"
        />
        <Card
          cat="Peinture"
          title="Peinture Acrylique Mat"
          desc="Peinture lessivable, finition mate"
          supplier="ColorPro"
          price="35.00"
          unit="par pot 10L"
        />
        <Card
          cat="Menuiserie"
          title="Porte Intérieure Bois"
          desc="Porte isoplane finition chêne"
          supplier="Menuiserie Moderne"
          price="280.00"
          unit="par unité"
        />
        <Card
          cat="Électricité"
          title="Disjoncteur 32A"
          desc="Disjoncteur différentiel 30mA"
          supplier="Electrotech"
          price="45.00"
          unit="par unité"
        />
        <Card
          cat="Sanitaire"
          title="Lavabo Céramique"
          desc="Lavabo suspendu blanc brillant"
          supplier="Sanitaire Pro"
          price="120.00"
          unit="par unité"
        />
      </div>
    </main>
  );
}
