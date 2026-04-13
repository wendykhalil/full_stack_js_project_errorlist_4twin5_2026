import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function Unauthorized() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-slate-900">{t('unauthorized.title')}</h1>
        <p className="mt-2 text-sm text-slate-500">{t('unauthorized.description')}</p>
        <div className="mt-6">
          <Link to="/login" className="inline-flex rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">
            {t('unauthorized.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}