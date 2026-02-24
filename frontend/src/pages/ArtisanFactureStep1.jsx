import React from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

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

const Input = ({ label, placeholder }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
    <input
      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
      placeholder={placeholder}
    />
  </div>
);

const Select = ({ label, placeholder }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
    <div className="relative">
      <select className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none">
        <option>{placeholder}</option>
      </select>
      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  </div>
);

const Textarea = ({ label, placeholder }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
    <textarea
      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
      rows={4}
      placeholder={placeholder}
    />
  </div>
);

export default function ArtisanFactureStep1() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">{t('artisanFactureStep1.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('artisanFactureStep1.subtitle')}</p>

      <Stepper step={1} />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('artisanFactureStep1.formTitle')}</h2>

        <div className="mt-6 space-y-6">
          <Select 
            label={t('artisanFactureStep1.projectLabel')} 
            placeholder={t('artisanFactureStep1.projectPlaceholder')} 
          />
          <Select 
            label={t('artisanFactureStep1.quoteBasedLabel')} 
            placeholder={t('artisanFactureStep1.quoteBasedPlaceholder')} 
          />
          <Input 
            label={t('artisanFactureStep1.clientLabel')} 
            placeholder={t('artisanFactureStep1.clientPlaceholder')} 
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Input 
              label={t('artisanFactureStep1.dueDateLabel')} 
              placeholder={t('artisanFactureStep1.dueDatePlaceholder')} 
            />
            <Select 
              label={t('artisanFactureStep1.paymentMethodLabel')} 
              placeholder={t('artisanFactureStep1.paymentMethodPlaceholder')} 
            />
          </div>

          <Textarea 
            label={t('artisanFactureStep1.notesLabel')} 
            placeholder={t('artisanFactureStep1.notesPlaceholder')} 
          />
        </div>

        <button
          onClick={() => navigate("/artisan/factures/new/step-2")}
          className="mt-6 w-full rounded-xl bg-indigo-700 py-4 font-semibold text-white hover:bg-indigo-800"
        >
          {t('artisanFactureStep1.nextButton')}
        </button>
      </div>
    </main>
  );
}