import React from "react";
import { useNavigate } from "react-router-dom";

const Stepper = ({ step }) => (
  <div className="mt-6 flex items-center gap-4">
    {[1, 2, 3].map((n) => (
      <React.Fragment key={n}>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
            step >= n ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
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

export default function ArtisanFactureStep2() {
  const navigate = useNavigate(); // ✅ MUST be here (before return)

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Créer une Facture</h1>
      <p className="mt-1 text-sm text-slate-500">Ajouter les articles</p>

      <Stepper step={2} />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Articles de la facture</h2>

        <div className="mt-6 rounded-2xl bg-slate-50 p-6">
          <input
            className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Description de l'article"
          />

          <div className="grid gap-4 md:grid-cols-4">
            <input className="rounded-xl border px-4 py-3 text-sm" defaultValue="1" />
            <input className="rounded-xl border px-4 py-3 text-sm" placeholder="Unité" />
            <input className="rounded-xl border px-4 py-3 text-sm" defaultValue="0" />
            <input className="rounded-xl border px-4 py-3 text-sm" defaultValue="0.00" />
          </div>
        </div>

        <div className="mt-6 space-y-2 text-sm text-slate-600">
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

        <div className="mt-4 flex justify-between">
          <span className="text-lg font-semibold">Total TTC:</span>
          <span className="text-lg font-semibold text-emerald-600">0.60 TND</span>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate("/artisan/factures/new")}
            className="flex-1 rounded-xl border py-3 font-medium"
          >
            Retour
          </button>

          <button
            onClick={() => navigate("/artisan/factures/new/step-3")}
            className="flex-1 rounded-xl bg-indigo-700 py-3 font-semibold text-white"
          >
            Suivant: Aperçu
          </button>
        </div>
      </div>
    </main>
  );
}
