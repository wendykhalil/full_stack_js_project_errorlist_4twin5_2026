import React from "react";
import { Search, ChevronDown, ShoppingCart, Star } from "lucide-react";

const ProductCard = ({
  image,
  category,
  title,
  description,
  supplier,
  price,
  unit,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <img
      src={image}
      alt={title}
      className="h-48 w-full rounded-xl object-cover"
    />

    <div className="mt-4">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        {category}
      </span>

      <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-2 text-sm text-slate-600">{supplier}</div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-indigo-700">
            {price} TND
          </div>
          <div className="text-xs text-slate-500">{unit}</div>
        </div>

        <div className="flex items-center gap-1 text-sm text-orange-500">
          <Star className="h-4 w-4 fill-orange-500" />
          4.5
        </div>
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
        <ShoppingCart className="h-4 w-4" />
        Ajouter au panier
      </button>
    </div>
  </div>
);

export default function ArtisanMarketplace() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Marketplace
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Découvrez et commandez des matériaux de construction
          </p>
        </div>

        <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
          🛒 Panier (0)
        </button>
      </div>

      {/* Filters */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher des produits..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="relative w-full md:w-60">
            <select className="w-full appearance-none rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none">
              <option>Toutes catégories</option>
              <option>Matériaux</option>
              <option>Peinture</option>
              <option>Menuiserie</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ProductCard
          image="https://images.unsplash.com/photo-1581091012184-7c61e6b1e6c1"
          category="Matériaux"
          title="Ciment CEM II 42.5"
          description="Ciment haute résistance"
          supplier="BatiMat Tunisie"
          price="12.50"
          unit="par sac 50kg"
        />

        <ProductCard
          image="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
          category="Revêtements"
          title="Carrelage Porcelaine 60x60"
          description="Aspect marbre blanc"
          supplier="Céramique Tunisie"
          price="25.00"
          unit="par m²"
        />

        <ProductCard
          image="https://images.unsplash.com/photo-1581578731548-c64695cc6952"
          category="Peinture"
          title="Peinture Acrylique Mat"
          description="Finition mate lessivable"
          supplier="ColorPro"
          price="35.00"
          unit="par pot 10L"
        />

        <ProductCard
          image="https://images.unsplash.com/photo-1582582494700-5d1d37f5d9c7"
          category="Menuiserie"
          title="Porte Intérieure Bois"
          description="Finition chêne"
          supplier="Menuiserie Moderne"
          price="280.00"
          unit="par unité"
        />
      </div>
    </main>
  );
}
