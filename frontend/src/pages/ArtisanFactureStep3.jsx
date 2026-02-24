import React from "react";
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

export default function ArtisanFactureStep3() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">
        {t('artisanFactureStep3.title')}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {t('artisanFactureStep3.subtitle')}
      </p>

      <Stepper step={3} />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 text-center">
          {t('artisanFactureStep3.invoiceTitle')}
        </h2>
        <p className="text-center text-sm text-slate-500">
          {t('artisanFactureStep3.invoiceNumber', { number: 'FACT-879082' })}
        </p>

        <div className="mt-8 flex justify-between text-sm text-slate-600">
          <div>
            <p>{t('artisanFactureStep3.clientLabel')}</p>
            <p className="mt-2">{t('artisanFactureStep3.projectLabel')}</p>
            <p className="mt-2">{t('artisanFactureStep3.paymentMethodLabel')}</p>
          </div>
          <div>
            <p>{t('artisanFactureStep3.dateLabel', { date: '14/02/2026' })}</p>
            <p className="mt-2">{t('artisanFactureStep3.dueDateLabel', { date: '-' })}</p>
          </div>
        </div>

        <div className="mt-8 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{t('artisanFactureStep3.subtotalLabel')}</span>
            <span>0.00 TND</span>
          </div>
          <div className="flex justify-between">
            <span>{t('artisanFactureStep3.vatLabel', { rate: 19 })}</span>
            <span>0.00 TND</span>
          </div>
          <div className="flex justify-between">
            <span>{t('artisanFactureStep3.stampLabel')}</span>
            <span>0.60 TND</span>
          </div>
        </div>

        <div className="mt-4 flex justify-between text-lg font-semibold">
          <span>{t('artisanFactureStep3.totalLabel')}</span>
          <span className="text-emerald-600">0.60 TND</span>
        </div>

        <div className="mt-8 flex gap-4">
          <button className="flex-1 rounded-xl border py-3 font-medium">
            {t('artisanFactureStep3.backButton')}
          </button>
          <button className="flex-1 rounded-xl border py-3 font-medium">
            {t('artisanFactureStep3.downloadButton')}
          </button>
          <button className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white">
            {t('artisanFactureStep3.sendButton')}
          </button>
        </div>
      </div>
    </main>
  );
}