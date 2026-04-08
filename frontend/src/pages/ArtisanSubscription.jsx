import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ShieldCheck, CreditCard, ArrowRight, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import StripePaymentForm from '../components/StripePaymentForm';
import { useAuth } from '../auth/AuthContext';

// Initialiser Stripe avec la clé publique
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function ArtisanSubscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const from = location.state?.from || '/artisan';

  const plans = {
    monthly: { 
      name: 'Mensuel', 
      price: 29, 
      interval: 'mois',
      features: ['Projets illimités', 'Devis et factures', 'Portfolio professionnel', 'Support prioritaire']
    },
    yearly: { 
      name: 'Annuel', 
      price: 299, 
      interval: 'an',
      features: ['Projets illimités', 'Devis et factures', 'Portfolio professionnel', 'Support prioritaire', 'Économie de 2 mois', 'Badge vérifié']
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    setPaymentSuccess(true);
    setMessage(`✅ Paiement réussi ! Votre abonnement ${selectedPlan === 'monthly' ? 'Mensuel' : 'Annuel'} est activé.`);
    
    // Rediriger après 2 secondes
    setTimeout(() => {
      navigate(from);
    }, 2000);
  };

  const handlePaymentError = (error) => {
    setMessage(`❌ Erreur: ${error}`);
    setPaymentSuccess(false);
  };

  const selectPlan = (plan) => {
    setSelectedPlan(plan);
    setMessage('');
    setPaymentSuccess(false);
  };

  const returnBack = () => {
    navigate(from);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">Devenez Artisan PRO</h1>
          <p className="mt-2 text-slate-600">Accédez à toutes les fonctionnalités pour développer votre activité</p>
        </div>

        {/* Cartes des abonnements */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Plan Mensuel */}
          <div className={`rounded-2xl border p-6 transition-all ${selectedPlan === 'monthly' ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Mensuel</h3>
              {selectedPlan === 'monthly' && <CheckCircle className="h-5 w-5 text-indigo-600" />}
            </div>
            <p className="mt-2 text-3xl font-bold text-indigo-600">29 €<span className="text-sm font-normal text-slate-500">/mois</span></p>
            <ul className="mt-4 space-y-2">
              {plans.monthly.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
            {selectedPlan !== 'monthly' && (
              <button
                onClick={() => selectPlan('monthly')}
                className="mt-6 w-full rounded-xl border border-indigo-600 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-all"
              >
                Choisir ce plan
              </button>
            )}
          </div>

          {/* Plan Annuel */}
          <div className={`rounded-2xl border p-6 transition-all ${selectedPlan === 'yearly' ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white'} relative`}>
            <div className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-xs font-semibold text-white">
              ÉCONOMISEZ 2 MOIS
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Annuel</h3>
              {selectedPlan === 'yearly' && <CheckCircle className="h-5 w-5 text-indigo-600" />}
            </div>
            <p className="mt-2 text-3xl font-bold text-indigo-600">299 €<span className="text-sm font-normal text-slate-500">/an</span></p>
            <p className="text-xs text-slate-500">Soit 24,92 €/mois</p>
            <ul className="mt-4 space-y-2">
              {plans.yearly.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
            {selectedPlan !== 'yearly' && (
              <button
                onClick={() => selectPlan('yearly')}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Choisir ce plan
              </button>
            )}
          </div>
        </div>

        {/* Formulaire de paiement Stripe */}
        {selectedPlan && (
          <div className="mx-auto mt-8 max-w-md">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900">
                  Paiement {selectedPlan === 'monthly' ? 'Mensuel' : 'Annuel'} - {plans[selectedPlan].price} €
                </h3>
              </div>

              {paymentSuccess ? (
                <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="mt-2 text-sm text-emerald-700">{message}</p>
                  <p className="mt-1 text-xs text-emerald-600">Redirection en cours...</p>
                </div>
              ) : (
                <>
                  {message && !paymentSuccess && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="inline h-4 w-4 mr-2" />
                      {message}
                    </div>
                  )}
                  
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      amount={plans[selectedPlan].price}
                      plan={selectedPlan}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                  
                  <p className="mt-4 text-center text-xs text-slate-400">
                    Paiement sécurisé par Stripe
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bouton retour */}
        <div className="mt-8 text-center">
          <button
            onClick={returnBack}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-slate-700 hover:bg-slate-100 transition-all"
          >
            Retour à l'espace artisan
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}