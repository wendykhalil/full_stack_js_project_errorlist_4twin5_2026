import React, { useEffect, useState } from "react";
import { Stars } from "./StarRating";
import { getReviewsForUser } from "../auth/api";
import { MessageSquare, Trash2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import reviewsService from "../services/reviewsService";

export default function ReviewsList({ userId, refreshTrigger = 0 }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getReviewsForUser({ userId })
      .then(res => {
        setReviews(res.reviews || []);
        setAvgRating(res.avgRating || 0);
        setTotal(res.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, refreshTrigger]);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet avis?")) return;
    
    try {
      setDeletingId(reviewId);
      await reviewsService.deleteReview(reviewId);
      setReviews(reviews.filter(r => r._id !== reviewId));
      setTotal(prev => prev - 1);
      // Recalculate avgRating
      const remaining = reviews.filter(r => r._id !== reviewId);
      if (remaining.length > 0) {
        setAvgRating(Number((remaining.reduce((s, r) => s + r.rating, 0) / remaining.length).toFixed(1)));
      } else {
        setAvgRating(0);
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Erreur lors de la suppression de l\'avis');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Avis</h2>
        {total > 0 && <Stars rating={avgRating} total={total} size="lg" />}
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-400">Aucun avis pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600 shrink-0">
                    {r.authorId?.firstName?.[0]}{r.authorId?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {r.authorId?.firstName} {r.authorId?.lastName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString("fr-TN", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  {user?._id === r.authorId?._id && (
                    <button
                      onClick={() => handleDeleteReview(r._id)}
                      disabled={deletingId === r._id}
                      className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Supprimer cet avis"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {r.comment && <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
