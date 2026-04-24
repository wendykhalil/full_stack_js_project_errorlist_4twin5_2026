import React from "react";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link to="/login" className="text-lg font-bold text-slate-900">BMP.tn</Link>
        <Link to="/login" className="text-sm text-blue-600 hover:underline">← Retour</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Conditions d'utilisation</h1>
        <p className="text-xs text-slate-400 mb-8">Dernière mise à jour : janvier 2025</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Acceptation des conditions</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            En accédant à BMP.tn et en utilisant nos services, vous acceptez d'être lié par les
            présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne
            pas utiliser la plateforme.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Utilisation de la plateforme</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Vous vous engagez à utiliser BMP.tn de manière légale et conforme à son objet. Tout
            usage frauduleux, abusif ou contraire aux bonnes mœurs est strictement interdit et
            pourra entraîner la suspension de votre compte.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Comptes utilisateurs</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Vous êtes responsable de la confidentialité de vos identifiants de connexion et de
            toutes les activités effectuées depuis votre compte. Signalez immédiatement tout accès
            non autorisé à{" "}
            <a href="mailto:security@bmp.tn" className="text-blue-600 hover:underline">
              security@bmp.tn
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Propriété intellectuelle</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Tout le contenu de BMP.tn (logo, design, textes, fonctionnalités) est la propriété
            exclusive de BMP.tn et est protégé par les lois sur la propriété intellectuelle.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Limitation de responsabilité</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            BMP.tn agit en tant qu'intermédiaire entre professionnels. Nous ne sommes pas
            responsables des litiges entre utilisateurs, des retards de livraison ou de la qualité
            des prestations réalisées hors de la plateforme.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Contact</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Pour toute question, consultez notre{" "}
            <Link to="/contact" className="text-blue-600 hover:underline">
              page Contact
            </Link>{" "}
            ou notre{" "}
            <Link to="/privacy" className="text-blue-600 hover:underline">
              Politique de confidentialité
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
