import React from "react";
import { ArrowLeft, FileSignature, ChevronDown } from "lucide-react";

// Artisan - Devis: Create Quote (Step 1)
// Tailwind required.

const StepDot = ({ n, active }) => (
  <div
    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
      active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
    }`}
  >
    {n}
  </div>
);

const Stepper = ({ step = 1 }) => (
  <div className="mt-8 flex items-center gap-4">
    <StepDot n={1} active={step === 1} />
    <div className="h-0.5 flex-1 rounded-full bg-slate-200" />
    <StepDot n={2} active={step === 2} />
    <div className="h-0.5 flex-1 rounded-full bg-slate-200" />
    <StepDot n={3} active={step === 3} />
  </div>
);

const FieldLabel = ({ children }) => (
  <label className="mb-2 block text-sm font-semibold text-slate-900">{children}</label>
);

const TextInput = (props) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none ${
      props.className ?? ""
    }`}
  />
);

const SelectInput = ({ placeholder = "Sélectionner..." }) => (
  <div className="relative">
    <select className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none">
      <option value="">{placeholder}</option>
      <option>Villa Ben Arous</option>
      <option>Appartement Tunis</option>
      <option>Bureau Ariana</option>
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
);

const TextArea = (props) => (
  <textarea
    {...props}
    className={`min-h-[140px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none ${
      props.className ?? ""
    }`}
  />
);

export default function ArtisanDevisCreate() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Back */}
        <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        {/* Centered header */}
        <div className="mx-auto mt-6 max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <FileSignature className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Créer un Devis</h1>
              <p className="mt-1 text-sm text-slate-500">Informations générales</p>
            </div>
          </div>

          <Stepper step={1} />

          {/* Form Card */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Informations du devis</h2>

            <div className="mt-6 space-y-6">
              <div>
                <FieldLabel>Projet associé</FieldLabel>
                <SelectInput placeholder="Sélectionner un projet..." />
              </div>

              <div>
                <FieldLabel>Client</FieldLabel>
                <TextInput placeholder="Nom du client" />
              </div>

              <div>
                <FieldLabel>Valable jusqu&apos;au</FieldLabel>
                <TextInput placeholder="mm/dd/yyyy" />
              </div>

              <div>
                <FieldLabel>Notes (optionnel)</FieldLabel>
                <TextArea placeholder="Conditions particulières, notes..." />
              </div>
            </div>

            <button className="mt-6 w-full rounded-2xl bg-indigo-700 px-5 py-4 text-sm font-semibold text-white shadow hover:bg-indigo-800">
              Suivant: Ajouter les articles
            </button>
          </div>

          

          {/* bottom spacing like screenshot */}
          <div className="h-10" />
        </div>
      </main>
    </div>
  );
}
