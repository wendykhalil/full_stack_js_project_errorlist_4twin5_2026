import React from "react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Gratuit",
    price: "0 TND",
    period: "/ mois",
    description: "Pour découvrir la plateforme.",
    features: [
      "1 projet actif",
      "1 portfolio",
      "1 devis / mois",
      "Accès au catalogue",
    ],
    cta: "Commencer gratuitement",
    highlight: false,
  },
  {
    name: "Basic",
    price: "29 TND",
    period: "/ mois",
    description: "Pour les professionnels actifs.",
    features: [
      "10 projets actifs",
      "5 portfolios",
      "20 devis / mois",
      "Messagerie activée",
      "Commandes fournisseurs",
      "Demandes de service",
    ],
    cta: "Choisir Basic",
    highlight: true,
  },
  {
    name: "Pro",
    price: "79 TND",
    period: "/ mois",
    description: "Pour les équipes et grandes entreprises.",
    features: [
      "Projets illimités",
      "Portfolios illimités",
      "Devis illimités",
      "IA illimitée",
      "Toutes les fonctionnalités",
      "Support prioritaire",
    ],
    cta: "Choisir Pro",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link to="/login" className="text-lg font-bold text-slate-900">BMP.tn</Link>
        <Link to="/login" className="text-sm text-blue-600 hover:underline">← Retour</Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-4 text-center">Tarifs</h1>
        <p className="text-slate-600 text-center mb-12">
          Choisissez le plan adapté à votre activité. Changez à tout moment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? "border-blue-600 bg-blue-600 text-white shadow-xl"
                  : "border-slate-200 bg-white text-slate-900"
              }`}
            >
              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <p className={`text-sm mb-4 ${plan.highlight ? "text-blue-100" : "text-slate-500"}`}>
                {plan.description}
              </p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className={`text-sm ${plan.highlight ? "text-blue-100" : "text-slate-500"}`}>
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className={plan.highlight ? "text-blue-200" : "text-blue-600"}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block text-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
