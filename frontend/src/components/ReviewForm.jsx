import React, { useState } from 'react';
import { Star, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import reviewsService from '../services/reviewsService';

export default function ReviewForm({ artisanId, artisanName, onSuccess }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Veuillez sélectionner une note');
      return;
    }
    
    if (comment.length < 10) {
      setError('Le commentaire doit contenir au moins 10 caractères');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await reviewsService.createReview({
        targetId: artisanId,
        targetType: 'ARTISAN',
        rating,
        title: title || 'Avis',
        comment,
      });

      if (result && result.ok) {
        setSuccess(true);
        setRating(0);
        setTitle('');
        setComment('');
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
          if (onSuccess) onSuccess();
        }, 3000);
      } else {
        setError(result?.message || 'Erreur lors de la soumission');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de la soumission de l\'avis';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Connectez-vous
          </a>
          {' '}pour laisser un avis
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Donnez votre avis sur {artisanName}
      </h3>

      {success && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-900">Avis publié avec succès!</p>
            <p className="text-xs text-green-700">Merci pour votre retour.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-3">
            Note <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-2 text-sm text-slate-600">
              Vous avez donné une note de {rating}/5
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-900 mb-2">
            Titre (optionnel)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Excellent travail"
            maxLength={100}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-slate-500">{title.length}/100</p>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-slate-900 mb-2">
            Votre avis <span className="text-red-500">*</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience avec cet artisan..."
            rows="4"
            maxLength={1000}
            className={`w-full rounded-xl border ${
              comment.length < 10 && comment.length > 0
                ? 'border-amber-300'
                : 'border-slate-200'
            } px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
          />
          <div className="mt-1 flex items-center justify-between">
            <p className={`text-xs ${
              comment.length < 10 && comment.length > 0
                ? 'text-amber-600'
                : 'text-slate-500'
            }`}>
              {comment.length < 10 && comment.length > 0
                ? `Minimum 10 caractères (${10 - comment.length} manquants)`
                : `${comment.length}/1000`
              }
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting || !rating || comment.length < 10}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publication...
              </>
            ) : (
              'Publier votre avis'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
