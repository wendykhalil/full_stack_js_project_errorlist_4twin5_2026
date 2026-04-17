/**
 * OrderReviewForm
 * Shown on the Order Details page when:
 *   - user is ARTISAN
 *   - order.status === 'DELIVERED'
 *   - order.review.isReviewed === false (or review absent)
 */
import { useState } from 'react';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { submitOrderReview } from '../auth/api';

export default function OrderReviewForm({ order, token, onReviewed }) {
  const [rating,      setRating]      = useState(0);
  const [hovered,     setHovered]     = useState(0);
  const [comment,     setComment]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [done,        setDone]        = useState(false);

  // Already reviewed guard (defensive)
  if (order?.review?.isReviewed || done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Avis enregistré</p>
            {order?.review?.rating && (
              <div className="mt-1 flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= order.review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                ))}
                {order.review.comment && (
                  <span className="ml-2 text-xs text-emerald-700 italic">"{order.review.comment}"</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Veuillez sélectionner une note (1–5 étoiles)'); return; }
    setError('');
    setSubmitting(true);
    try {
      await submitOrderReview({ token, orderId: order._id, rating, comment });
      setDone(true);
      onReviewed?.();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
        <Star className="h-4 w-4 text-amber-500" />
        Donnez votre avis sur ce produit
        <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          ✓ Achat vérifié
        </span>
      </h3>
      <p className="mt-1 text-xs text-indigo-600">
        Votre avis aide les autres artisans à choisir les meilleurs produits.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Star picker */}
        <div>
          <p className="mb-2 text-xs font-medium text-slate-700">Note *</p>
          <div
            className="flex items-center gap-1"
            onMouseLeave={() => setHovered(0)}
          >
            {[1,2,3,4,5].map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                className="p-0.5 transition-transform hover:scale-110"
                aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    value <= (hovered || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-200 text-slate-200'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-semibold text-amber-600">
                {['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent'][rating]}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Commentaire <span className="text-slate-400">(optionnel)</span>
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Qualité du produit, délai de livraison, emballage…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none resize-none"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{comment.length}/1000</p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…</>
          ) : (
            <><Star className="h-4 w-4" /> Publier mon avis</>
          )}
        </button>
      </form>
    </div>
  );
}
