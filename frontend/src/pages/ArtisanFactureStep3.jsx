import React from "react";

export default function ArtisanFactureStep3() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">
        Créer une Facture
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Vérifier et envoyer
      </p>

      <Stepper step={3} />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 text-center">
          FACTURE
        </h2>
        <p className="text-center text-sm text-slate-500">
          N° FACT-879082
        </p>

        <div className="mt-8 flex justify-between text-sm text-slate-600">
          <div>
            <p>Client</p>
            <p className="mt-2">Projet</p>
            <p className="mt-2">Mode de paiement</p>
          </div>
          <div>
            <p>Date: 14/02/2026</p>
            <p className="mt-2">Échéance: -</p>
          </div>
        </div>

        <div className="mt-8 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Sous-total:</span>
            <span>0.00 TND</span>
          </div>
          <div className="flex justify-between">
            <span>TVA (19%):</span>
            <span>0.00 TND</span>
          </div>
          <div className="flex justify-between">
            <span>Timbre fiscal:</span>
            <span>0.60 TND</span>
          </div>
        </div>

        <div className="mt-4 flex justify-between text-lg font-semibold">
          <span>Total TTC:</span>
          <span className="text-emerald-600">0.60 TND</span>
        </div>

        <div className="mt-8 flex gap-4">
          <button className="flex-1 rounded-xl border py-3 font-medium">
            Retour
          </button>
          <button className="flex-1 rounded-xl border py-3 font-medium">
            Télécharger PDF
          </button>
          <button className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white">
            Envoyer au client
          </button>
        </div>
      </div>
    </main>
  );
}

const Stepper = ({ step }) => (
  <div className="mt-6 flex items-center gap-4">
    {[1, 2, 3].map((n) => (
      <React.Fragment key={n}>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
            step >= n
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {n}
        </div>
        {n !== 3 && (
          <div
            className={`h-1 flex-1 rounded-full ${
              step > n ? "bg-emerald-600" : "bg-slate-200"
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);
