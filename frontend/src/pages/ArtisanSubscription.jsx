import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import SimpleFooter from '../components/Footer';
import { loadStripe } from '@stripe/stripe-js';
import { ShieldCheck, CreditCard, ArrowRight, AlertCircle, CheckCircle, Tag, X, Crown, Clock, XCircle, History, Zap, Check } from 'lucide-react';
import StripePaymentForm from '../components/StripePaymentForm';
import { useAuth } from '../auth/AuthContext';
import { validatePromoCode, getMySubscription, cancelSubscription, startTrial } from '../auth/api';
import { Hint } from '../components/MouseTooltip';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PLAN_FEATURES = {
  FREE:  { label: 'Gratuit',  color: 'slate',  price: 0 },
  BASIC: { label: 'Basic',    color: 'indigo', price: 40 },
  PRO:   { label: 'Pro',      color: 'purple', price: 399 },
};

const FEATURES_TABLE = [
  { label: 'Projets',              free: '1 (essai)', basic: 'Limité',  pro: 'Illimité' },
  { label: 'Portfolio',            free: '1 (essai)', basic: 'Limité',  pro: 'Illimité' },
  { label: 'Devis / mois',         free: '1 (essai)', basic: 'Limité',  pro: 'Illimité' },
  { label: 'Factures / mois',      free: '1 (essai)', basic: 'Limité',  pro: 'Illimité' },
  { label: 'Messagerie',           free: false,       basic: true,      pro: true },
  { label: 'Commandes marketplace',free: false,       basic: true,      pro: true },
  { label: 'Demandes de service',  free: false,       basic: true,      pro: true },
  { label: 'Assistant IA',         free: false,       basic: 'Limité',  pro: 'Illimité' },
  { label: 'Météo chantier',       free: false,       basic: true,      pro: true },
  { label: 'Badge PRO profil',     free: false,       basic: false,     pro: true },
];

function FeatureCell({ value }) {
  if (value === true)  return <Check className="mx-auto h-4 w-4 text-emerald-500" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-slate-300" />;
  return <span className="text-xs font-medium text-slate-700">{value}</span>;
}

function ExpiryBanner({ daysLeft, isOnTrial, onRenew }) {
  if (daysLeft === null || daysLeft > 7) return null;
  const urgent = daysLeft <= 3;
  return (
    <div className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 ${urgent ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
      <div className="flex items-center gap-3">
        <Clock className={`h-5 w-5 shrink-0 ${urgent ? 'text-red-500' : 'text-orange-500'}`} />
        <p className={`text-sm font-medium ${urgent ? 'text-red-700' : 'text-orange-700'}`}>
          {isOnTrial ? `Votre essai gratuit expire dans ${daysLeft} jour(s).` : `Votre abonnement expire dans ${daysLeft} jour(s).`}
          {' '}Renouvelez maintenant pour ne pas perdre l'accès.
        </p>
      </div>
      <button onClick={onRenew} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white ${urgent ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
        Renouveler
      </button>
    </div>
  );
}

export default function ArtisanSubscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const from = location.state?.from || '/artisan';

  const [sub, setSub] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [message, setMessage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const plans = {
    monthly: { name: 'Basic Mensuel', price: 40, interval: 'mois', plan: 'BASIC',
      features: ['Projets limités', 'Portfolio limité', 'Devis & factures limités', 'Messagerie', 'Marketplace & commandes', 'Demandes de service', 'IA limitée', 'Météo chantier'] },
    yearly:  { name: 'Pro Annuel',    price: 399, interval: 'an',  plan: 'PRO',
      features: ['Projets illimités', 'Portfolio illimité', 'Devis & factures illimités', 'Messagerie', 'Marketplace & commandes', 'Demandes de service', 'IA illimitée', 'Météo chantier', 'Badge PRO sur profil'] },
  };

  useEffect(() => {
    getMySubscription({ token })
      .then(res => setSub(res?.data || null))
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, [token]);

  const isActive = sub?.status === 'ACTIVE' && sub?.plan !== 'FREE';
  const daysLeft = sub?.daysUntilExpiry ?? null;

  async function handleCancel() {
    if (!window.confirm('Annuler votre abonnement ? Vous gardez l\'accès jusqu\'à la fin de la période.')) return;
    try {
      setCanceling(true);
      await cancelSubscription({ token });
      const res = await getMySubscription({ token });
      setSub(res?.data || null);
      setMessage('Abonnement annulé. Accès maintenu jusqu\'à expiration.');
    } catch (e) { setMessage('Erreur: ' + e.message); }
    finally { setCanceling(false); }
  }

  async function handleTrial() {
    try {
      setTrialLoading(true);
      await startTrial({ token });
      const res = await getMySubscription({ token });
      setSub(res?.data || null);
      setMessage('✅ Essai gratuit PRO de 14 jours activé !');
    } catch (e) { setMessage('Erreur: ' + e.message); }
    finally { setTrialLoading(false); }
  }

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    try {
      setPromoLoading(true); setPromoError('');
      const res = await validatePromoCode({ token, code: promoInput, plan: selectedPlan });
      setPromoCode(res.code); setPromoDiscount(res.discountPercent);
    } catch (e) { setPromoError(e.message); setPromoCode(''); setPromoDiscount(0); }
    finally { setPromoLoading(false); }
  };

  const removePromo = () => { setPromoCode(''); setPromoInput(''); setPromoDiscount(0); setPromoError(''); };
  const getFinalPrice = (base) => promoDiscount ? Number((base * (1 - promoDiscount / 100)).toFixed(2)) : base;

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setMessage(`✅ Abonnement ${selectedPlan === 'monthly' ? 'Basic' : 'Pro'} activé !`);
    setTimeout(() => { window.location.href = from; }, 2000);
  };

  const selectPlan = (p) => {
    setSelectedPlan(p); setMessage(''); setPaymentSuccess(false);
    setPromoCode(''); setPromoInput(''); setPromoDiscount(0); setPromoError('');
  };

  if (subLoading) return <div className="py-20 text-center text-slate-400">Chargement…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="mx-auto max-w-none px-5 sm:px-7 space-y-9">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-slate-900">Abonnement</h1>
          <p className="mt-2.5 text-lg text-slate-500">Gérez votre plan et accédez à toutes les fonctionnalités</p>
        </div>

        {/* Expiry banner */}
        <ExpiryBanner daysLeft={daysLeft} isOnTrial={sub?.isOnTrial} onRenew={() => setSelectedPlan('yearly')} />

        {/* Current plan card */}
        {sub && (
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-indigo-50 p-3">
                  <Crown className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plan actuel</p>
                    <p className="text-2xl font-bold text-slate-900">
                    {PLAN_FEATURES[sub.plan]?.label || sub.plan}
                    {sub.isOnTrial && <span className="ml-2 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">Essai</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    Statut: <span className={`font-medium ${sub.status === 'ACTIVE' ? 'text-emerald-600' : sub.status === 'CANCELED' ? 'text-orange-500' : 'text-red-500'}`}>{sub.status}</span>
                    {sub.endDate && <span className="ml-2">· Expire le {new Date(sub.endDate).toLocaleDateString('fr-TN')}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {sub.history?.length > 0 && (
                  <button onClick={() => setShowHistory(h => !h)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                    <History className="h-4 w-4" /> Historique
                  </button>
                )}
                {isActive && sub.status !== 'CANCELED' && (
                  <Hint text="Annuler votre abonnement. Vous gardez l'accès jusqu'à la fin de la période payée.">
                  <button onClick={handleCancel} disabled={canceling}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
                    <XCircle className="h-4 w-4" /> {canceling ? 'Annulation…' : 'Annuler'}
                  </button>
                  </Hint>
                )}
              </div>
            </div>

            {/* History */}
            {showHistory && sub.history?.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Historique</p>
                <div className="space-y-2">
                  {[...sub.history].reverse().map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{h.note || `${h.plan} → ${h.status}`}</span>
                      <span className="text-xs text-slate-400">{new Date(h.changedAt).toLocaleDateString('fr-TN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trial CTA — only if FREE and never trialed */}
        {(!sub || sub.plan === 'FREE') && !sub?.history?.some(h => h.note?.includes('Trial')) && (
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-purple-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Essayez PRO gratuitement pendant 14 jours</p>
                <p className="text-sm text-slate-500">Aucune carte requise. Accès complet à toutes les fonctionnalités.</p>
              </div>
            </div>
            <Hint text="Essayez toutes les fonctionnalités PRO gratuitement pendant 14 jours, sans carte bancaire.">
            <button onClick={handleTrial} disabled={trialLoading}
              className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50">
              {trialLoading ? 'Activation…' : 'Démarrer l\'essai gratuit'}
            </button>
            </Hint>
          </div>
        )}

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {message}
          </div>
        )}

        {/* Features comparison table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-7 py-4.5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Comparaison des plans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-7 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Fonctionnalité</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Gratuit</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-indigo-600">Basic</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-purple-600">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {FEATURES_TABLE.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-7 py-3.5 text-slate-700">{row.label}</td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell value={row.free} /></td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell value={row.basic} /></td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell value={row.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plan selection */}
        <div className="grid gap-7 md:grid-cols-2">
          {Object.entries(plans).map(([key, plan]) => (
            <Hint key={key} text={key === 'monthly' ? 'Plan Basic mensuel : accès aux fonctionnalités essentielles pour démarrer votre activité.' : 'Plan Pro annuel : accès illimité à toutes les fonctionnalités pour les professionnels actifs.'}>
            <div onClick={() => selectPlan(key)}
              className={`cursor-pointer rounded-2xl border p-7 transition-all ${selectedPlan === key ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white hover:border-indigo-200'} relative`}>
              {key === 'yearly' && (
                <div className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-xs font-semibold text-white">
                  MEILLEURE VALEUR
                </div>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-slate-900">{plan.name}</h3>
                {selectedPlan === key && <CheckCircle className="h-5 w-5 text-indigo-600" />}
              </div>
              <p className="mt-2 text-4xl font-bold text-indigo-600">
                {plan.price} TND<span className="text-sm font-normal text-slate-500">/{plan.interval}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            </Hint>
          ))}
        </div>

        {/* Payment form */}
        {selectedPlan && (
          <div className="mx-auto max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3.5">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-900">{plans[selectedPlan].name}</h3>
                <span className="ml-auto font-bold text-indigo-600">
                  {promoDiscount > 0 ? (
                    <><span className="line-through text-slate-400 text-sm font-normal mr-1">{plans[selectedPlan].price} TND</span>{getFinalPrice(plans[selectedPlan].price)} TND</>
                  ) : `${plans[selectedPlan].price} TND`}
                </span>
              </div>

              {/* Promo code */}
              <div className="mt-4">
                {promoCode ? (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
                    <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                      <Tag className="h-4 w-4" />{promoCode} — {promoDiscount}% de réduction
                    </div>
                    <button onClick={removePromo}><X className="h-4 w-4 text-emerald-500" /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                      placeholder="Code promo"
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button onClick={applyPromo} disabled={promoLoading || !promoInput.trim()}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                      {promoLoading ? '…' : 'Appliquer'}
                    </button>
                  </div>
                )}
                {promoError && <p className="mt-1.5 text-xs text-red-600">{promoError}</p>}
              </div>

              {paymentSuccess ? (
                <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="mt-2 text-sm text-emerald-700">{message}</p>
                  <p className="mt-1 text-xs text-emerald-600">Redirection en cours…</p>
                </div>
              ) : (
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    amount={getFinalPrice(plans[selectedPlan].price)}
                    plan={selectedPlan}
                    promoCode={promoCode}
                    onSuccess={handlePaymentSuccess}
                    onError={e => setMessage('❌ ' + e)}
                  />
                </Elements>
              )}
              <p className="mt-3 text-center text-xs text-slate-400">Paiement sécurisé par Stripe</p>
            </div>
          </div>
        )}

      </div>
    </div>
    <SimpleFooter />
  );
}
