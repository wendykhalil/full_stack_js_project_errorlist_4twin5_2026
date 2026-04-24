import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link to="/login" className="text-lg font-bold text-slate-900">BMP.tn</Link>
        <Link to="/login" className="text-sm text-blue-600 hover:underline">← Retour</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">À propos de BMP.tn</h1>
        <p className="text-slate-600 mb-6">
          BMP.tn est la plateforme de référence en Tunisie pour connecter les professionnels
          du bâtiment : artisans, prescripteurs et fournisseurs.
        </p>
        <p className="text-slate-600 mb-6">
          Notre mission est de digitaliser et simplifier la collaboration dans le secteur
          de la construction en Afrique du Nord, en offrant des outils modernes adaptés
          aux besoins des professionnels.
        </p>
        <p className="text-slate-600">
          Fondée en Tunisie, BMP.tn accompagne des milliers de professionnels dans la
          gestion de leurs projets, devis, factures et commandes au quotidien.
        </p>
      </main>
    </div>
  );
}
