import React, { useState } from "react";
import { X } from "lucide-react";
import { StarPicker } from "./StarRating";
import { submitReview } from "../auth/api";
import { useAuth } from "../auth/AuthContext";

export default function ReviewModal({ open, onClose, onDone, target, sourceId }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!open || !target) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) return setErr("Veuillez choisir une note");
    try {
      setLoading(true);
      setErr("");
      await submitReview({
        token,
        data: {
          targetId: target._id,
          targetType: target.targetType,
          rating,
          comment,
          sourceId,
        },
      });
      setRating(0);
      setComment("");
      onDone?.();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Laisser un avis</h3>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
              {target.firstName?.[0]}{target.lastName?.[0]}
            </div>
            <div>
              <p className="font-medium text-slate-900">{target.firstName} {target.lastName}</p>
              <p className="text-xs text-slate-400">{target.targetType === "ARTISAN" ? "Artisan" : "Prescripteur"}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Note *</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Commentaire (optionnel)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Partagez votre expérience…" />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button type="submit" disabled={loading || !rating}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Envoi…" : "Publier l'avis"}
          </button>
        </form>
      </div>
    </div>
  );
}
