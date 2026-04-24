import React from "react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link to="/login" className="text-lg font-bold text-slate-900">BMP.tn</Link>
        <Link to="/login" className="text-sm text-blue-600 hover:underline">← Retour</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 prose prose-slate">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Politique de confidentialité</h1>
        <p className="text-xs text-slate-400 mb-8">Dernière mise à jour : janvier 2025</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Données collectées</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            BMP.tn collecte les données que vous fournissez lors de votre inscription (nom, email,
            téléphone, rôle professionnel) ainsi que les données générées par votre utilisation de
            la plateforme (projets, commandes, messages).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Utilisation des données</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Vos données sont utilisées pour fournir et améliorer nos services, vous mettre en
            relation avec d'autres professionnels, et vous envoyer des notifications liées à votre
            activité sur la plateforme. Nous ne vendons jamais vos données à des tiers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Sécurité</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos
            données contre tout accès non autorisé, perte ou divulgation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Vos droits</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Conformément à la législation applicable, vous disposez d'un droit d'accès, de
            rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous
            à{" "}
            <a href="mailto:privacy@bmp.tn" className="text-blue-600 hover:underline">
              privacy@bmp.tn
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Contact</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Pour toute question relative à cette politique, vous pouvez nous contacter via la{" "}
            <Link to="/contact" className="text-blue-600 hover:underline">
              page Contact
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
