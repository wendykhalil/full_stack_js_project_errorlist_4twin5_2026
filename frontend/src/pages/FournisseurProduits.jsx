import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Package,
  ShoppingCart,
  TrendingUp,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";

const StatCard = ({ title, value, icon, iconBg, iconFg }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </div>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
    </div>
  </div>
);

const Pill = ({ children, tone = "slate" }) => {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-100 text-indigo-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
};

const PriceCell = ({ price, unit }) => (
  <div className="text-right">
    <div className="font-medium text-slate-900">{price}</div>
    <div className="text-xs text-slate-500">{unit}</div>
  </div>
);

const ActionBtn = ({ children, className = "" }) => (
  <button className={`inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 ${className}`}>
    {children}
  </button>
);

export default function FournisseurProduits() {
  const navigate = useNavigate();

  const rows = [
    {
      name: "Ciment CEM II 42.5",
      desc: "Ciment haute résistance pour tous travaux",
      cat: "Matériaux de base",
      price: "12.50 TND",
      unit: "par sac 50kg",
      stock: { label: "En stock", tone: "green" },
      status: { label: "Actif", tone: "indigo" },
    },
    {
      name: "Carrelage Porcelaine 60x60",
      desc: "Carrelage aspect marbre blanc",
      cat: "Revêtements",
      price: "25.00 TND",
      unit: "par m²",
      stock: { label: "En stock", tone: "green" },
      status: { label: "Actif", tone: "indigo" },
    },
    {
      name: "Peinture Acrylique Mat",
      desc: "Peinture lessivable, finition mate",
      cat: "Peinture",
      price: "35.00 TND",
      unit: "par pot 10L",
      stock: { label: "En stock", tone: "green" },
      status: { label: "Actif", tone: "indigo" },
    },
    {
      name: "Porte Intérieure Bois",
      desc: "Porte isoplane finition chêne",
      cat: "Menuiserie",
      price: "280.00 TND",
      unit: "par unité",
      stock: { label: "En stock", tone: "green" },
      status: { label: "Actif", tone: "indigo" },
    },
    {
      name: "Disjoncteur 32A",
      desc: "Disjoncteur différentiel 30mA",
      cat: "Électricité",
      price: "45.00 TND",
      unit: "par unité",
      stock: { label: "En stock", tone: "green" },
      status: { label: "Actif", tone: "indigo" },
    },
    {
      name: "Lavabo Céramique",
      desc: "Lavabo suspendu blanc brillant",
      cat: "Sanitaire",
      price: "120.00 TND",
      unit: "par unité",
      stock: { label: "Rupture", tone: "red" },
      status: { label: "Actif", tone: "indigo" },
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Title + CTA */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Gestion des Produits
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gérez votre catalogue de produits et équipements
          </p>
        </div>

        <button
          onClick={() => navigate("/fournisseur/produits/new")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800"
        >
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </button>
      </div>

      {/* Stats */}
      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Produits actifs" value="42" icon={<Package />} iconBg="bg-indigo-50" iconFg="text-indigo-600" />
        <StatCard title="Commandes ce mois" value="127" icon={<ShoppingCart />} iconBg="bg-emerald-50" iconFg="text-emerald-600" />
        <StatCard title="Chiffre d'affaires" value="45,280 TND" icon={<TrendingUp />} iconBg="bg-orange-50" iconFg="text-orange-600" />
        <StatCard title="Catalogues" value="3" icon={<FileText />} iconBg="bg-slate-100" iconFg="text-slate-700" />
      </section>

      {/* Table card */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Mes Produits</h2>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Rechercher..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="border-b border-slate-200 pb-3 font-semibold">Produit</th>
                <th className="border-b border-slate-200 pb-3 font-semibold">Catégorie</th>
                <th className="border-b border-slate-200 pb-3 text-right font-semibold">Prix</th>
                <th className="border-b border-slate-200 pb-3 text-center font-semibold">Stock</th>
                <th className="border-b border-slate-200 pb-3 text-center font-semibold">Statut</th>
                <th className="border-b border-slate-200 pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="text-sm">
                  <td className="border-b border-slate-100 py-5">
                    <div className="font-medium text-slate-900">{r.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{r.desc}</div>
                  </td>

                  <td className="border-b border-slate-100 py-5">
                    <Pill tone="slate">{r.cat}</Pill>
                  </td>

                  <td className="border-b border-slate-100 py-5">
                    <PriceCell price={r.price} unit={r.unit} />
                  </td>

                  <td className="border-b border-slate-100 py-5 text-center">
                    <Pill tone={r.stock.tone}>{r.stock.label}</Pill>
                  </td>

                  <td className="border-b border-slate-100 py-5 text-center">
                    <Pill tone={r.status.tone}>{r.status.label}</Pill>
                  </td>

                  <td className="border-b border-slate-100 py-5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <ActionBtn>
                        <Pencil className="h-4 w-4 text-slate-600" />
                      </ActionBtn>
                      <ActionBtn className="hover:bg-red-50">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
