import React from "react";
import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    title: "Créez votre compte",
    description: "Inscrivez-vous en tant qu'artisan, prescripteur ou fournisseur en quelques minutes.",
  },
  {
    number: "02",
    title: "Complétez votre profil",
    description: "Ajoutez vos compétences, votre portfolio et vos informations professionnelles.",
  },
  {
    number: "03",
    title: "Connectez-vous",
    description: "Trouvez des partenaires, publiez des projets et répondez aux demandes de service.",
  },
  {
    number: "04",
    title: "Gérez vos projets",
    description: "Créez des devis, des factures et suivez l'avancement de vos chantiers en temps réel.",
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link to="/login" className="text-lg font-bold text-slate-900">BMP.tn</Link>
        <Link to="/login" className="text-sm text-blue-600 hover:underline">← Retour</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Comment ça marche ?</h1>
        <p className="text-slate-600 mb-12">
          BMP.tn est conçu pour être simple et efficace. Voici comment démarrer.
        </p>

        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {step.number}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">{step.title}</h2>
                <p className="text-slate-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link
            to="/register"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Commencer gratuitement
          </Link>
        </div>
      </main>
    </div>
  );
}
