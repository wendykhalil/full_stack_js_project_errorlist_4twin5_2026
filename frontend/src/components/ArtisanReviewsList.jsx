import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import reviewsService from '../services/reviewsService';
import { useAuth } from '../auth/AuthContext';

export default function ArtisanReviewsList({ artisanId, maxReviews = 3 }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reviewsService.getArtisanReviews(artisanId);
        
        if (data && data.ok) {
          setReviews(data.reviews || []);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error('Error loading reviews:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement des avis');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    if (artisanId) {
      loadReviews();
    }
  }, [artisanId]);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet avis?")) return;
    
    try {
      setDeletingId(reviewId);
      await reviewsService.deleteReview(reviewId);
      setReviews(reviews.filter(r => r._id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Erreur lors de la suppression de l\'avis');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <AlertCircle className="h-3 w-3" />
        <span>Avis non disponibles</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-xs text-slate-400 flex items-center gap-1">
        <MessageCircle className="h-3 w-3" />
        Aucun avis pour le moment
      </div>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, maxReviews);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <MessageCircle className="h-4 w-4" />
        {reviews.length} avis
      </div>

      {displayedReviews.map((review) => (
        <div key={review._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-medium text-indigo-700 flex-shrink-0">
                {review.authorId?.firstName?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-900">
                  {review.authorId?.firstName} {review.authorId?.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              {user?._id === review.authorId?._id && (
                <button
                  onClick={() => handleDeleteReview(review._id)}
                  disabled={deletingId === review._id}
                  className="ml-1 p-1 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Supprimer cet avis"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {review.comment && (
            <p className="text-xs text-slate-600 line-clamp-2">{review.comment}</p>
          )}
        </div>
      ))}

      {reviews.length > maxReviews && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium py-2 transition-colors"
        >
          {showAll ? 'Afficher moins' : `Voir tous les ${reviews.length} avis`}
        </button>
      )}
    </div>
  );
}
