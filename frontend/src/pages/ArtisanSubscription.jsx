import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, CreditCard, ArrowRight, AlertCircle } from 'lucide-react';

export default function ArtisanSubscription() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const from = location.state?.from || '/artisan';

  const proceedToPayment = async () => {
    setLoading(true);
    setMessage('');
    try {
      // Ici, vous pouvez faire l'appel réel au paiement. Pour l'instant just stub.
      setTimeout(() => {
        setMessage('Page de paiement prête. Vous pouvez implémenter Stripe / PayPal ici.');
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error(error);
      setMessage('Erreur interne lors de la préparation du paiement.');
      setLoading(false);
    }
  };

  const returnBack = () => {
    navigate(from);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="rounded-xl border border-slate-200 p-6 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-indigo-500" />
          <h1 className="text-xl font-semibold">Page d'abonnement Artisan</h1>
        </div>

        <p className="mt-4 text-slate-600">
          Pour accéder à toutes les fonctionnalités de l'espace artisan (projets, portfolio, devis, factures), vous devez activer un abonnement PRO.
        </p>

        <ul className="mt-4 space-y-2 text-slate-700">
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Accès complet aux pages artisan.
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Création de projets et portfolio.
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Suivi des commandes et devis.
          </li>
        </ul>

        {message && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <AlertCircle className="inline h-4 w-4 mr-2 text-indigo-500" />
            {message}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={proceedToPayment}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Préparation...' : 'Terminer le paiement'}
          </button>
          <button
            onClick={returnBack}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-slate-700 hover:bg-slate-100"
          >
            Retour à {from || '/artisan'} <ArrowRight className="inline h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
