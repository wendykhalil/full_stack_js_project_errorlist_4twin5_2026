import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Minus, Package, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../context/CartContext';
import { checkoutCart } from '../auth/api';
import SimpleFooter from '../components/Footer';

const fmt = (n) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 2 }).format(n ?? 0);

export default function ArtisanCart() {
  const navigate  = useNavigate();
  const { token } = useAuth();
  const { items, total, itemCount, loading, removeItem, updateQty, refresh } = useCart();

  const [city,           setCity]           = useState('');
  const [street,         setStreet]         = useState('');
  const [postalCode,     setPostalCode]      = useState('');
  const [artisanMessage, setArtisanMessage]  = useState('');
  const [checking,       setChecking]        = useState(false);
  const [result,         setResult]          = useState(null); // { orders, errors }
  const [formError,      setFormError]       = useState('');

  const handleCheckout = async () => {
    if (!city.trim()) { setFormError('La ville est requise'); return; }
    setFormError('');
    setChecking(true);
    try {
      const res = await checkoutCart({
        token,
        deliveryAddress: { city: city.trim(), street: street.trim(), postalCode: postalCode.trim(), country: 'Tunisie' },
        artisanMessage,
      });
      setResult(res);
      await refresh();
    } catch (err) {
      setFormError(err.message || 'Erreur lors du checkout');
    } finally {
      setChecking(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="flex-1 space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-2xl font-bold text-emerald-800">Commandes passées !</h2>
          <p className="mt-2 text-emerald-700">{result.message}</p>
          {result.errors?.length > 0 && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left">
              <p className="text-sm font-semibold text-amber-800">Produits non commandés :</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-amber-700 mt-1">• {e.productName || 'Produit'} — {e.reason}</p>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => navigate('/artisan/orders')}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
              Voir mes commandes
            </button>
            <button onClick={() => navigate('/artisan/marketplace')}
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Continuer mes achats
            </button>
          </div>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Mon panier</h1>
          <p className="mt-1 text-sm text-slate-500">
            {itemCount > 0 ? `${itemCount} article${itemCount > 1 ? 's' : ''}` : 'Panier vide'}
          </p>
        </div>
        <button onClick={() => navigate('/artisan/marketplace')}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
          ← Continuer mes achats
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">Votre panier est vide</p>
          <button onClick={() => navigate('/artisan/marketplace')}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
            Parcourir le catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => {
              const p = item.product;
              return (
                <div key={item._id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  {/* Image */}
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {p.imageUrls?.[0]
                      ? <img src={p.imageUrls[0]} alt={p.name} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><Package className="h-6 w-6 text-slate-300" /></div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.categoryId?.name} · {p.supplierId?.companyName || 'Fournisseur'}</p>
                    <p className="mt-1 text-sm font-semibold text-indigo-700">{fmt(item.priceSnapshot)} / unité</p>

                    {/* Qty controls */}
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => item.quantity > 1 ? updateQty(p._id, item.quantity - 1) : removeItem(p._id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQty(p._id, item.quantity + 1)}
                        disabled={item.quantity >= (p.stock ?? 99)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <span className="ml-2 text-xs text-slate-400">Stock: {p.stock}</span>
                    </div>
                  </div>

                  {/* Line total + remove */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <button onClick={() => removeItem(p._id)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-base font-bold text-slate-900">{fmt(item.lineTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order summary + checkout */}
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Récapitulatif</h3>
              <div className="mt-4 space-y-2">
                {items.map(i => (
                  <div key={i._id} className="flex justify-between text-sm">
                    <span className="text-slate-600 truncate max-w-[60%]">{i.product.name} ×{i.quantity}</span>
                    <span className="font-medium text-slate-800">{fmt(i.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4 flex justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-xl font-bold text-indigo-700">{fmt(total)}</span>
              </div>
            </div>

            {/* Delivery form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-base font-semibold text-slate-800">Adresse de livraison</h3>
              <div>
                <label className="text-xs font-medium text-slate-600">Ville *</label>
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Ex: Tunis"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Rue / Quartier</label>
                <input value={street} onChange={e => setStreet(e.target.value)}
                  placeholder="Ex: Rue de la Liberté"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Code postal</label>
                <input value={postalCode} onChange={e => setPostalCode(e.target.value)}
                  placeholder="Ex: 1000"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Message (optionnel)</label>
                <textarea value={artisanMessage} onChange={e => setArtisanMessage(e.target.value)}
                  rows={2} placeholder="Instructions de livraison…"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
              </div>

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <button onClick={handleCheckout} disabled={checking || items.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {checking
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Commande en cours…</>
                  : <><ShoppingBag className="h-4 w-4" /> Commander tout le panier</>
                }
              </button>
              <p className="text-center text-xs text-slate-400">
                {items.length} produit{items.length > 1 ? 's' : ''} · {items.length} commande{items.length > 1 ? 's' : ''} créée{items.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      <SimpleFooter />
    </div>
  );
}
