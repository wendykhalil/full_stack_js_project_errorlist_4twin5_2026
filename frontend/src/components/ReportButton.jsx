import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { submitReport } from '../auth/api';

const REASONS = [
  { value: 'FAKE_PROFILE', label: 'Faux profil' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Contenu inapproprié' },
  { value: 'FRAUD', label: 'Fraude' },
  { value: 'HARASSMENT', label: 'Harcèlement' },
  { value: 'OTHER', label: 'Autre' },
];

export default function ReportButton({ targetId, targetType = 'USER', targetName }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason) return setErr('Veuillez choisir une raison');
    try {
      setLoading(true);
      await submitReport({ token, data: { targetId, targetType, reason, description } });
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
        <Flag className="h-3.5 w-3.5" /> Signaler
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Signaler {targetName || 'cet utilisateur'}</h3>
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              {done ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                  <p className="font-semibold text-emerald-700">Signalement envoyé</p>
                  <p className="text-sm text-emerald-600 mt-1">Notre équipe examinera votre signalement.</p>
                  <button onClick={() => { setOpen(false); setDone(false); setReason(''); setDescription(''); }}
                    className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    Fermer
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Raison *</label>
                    <select value={reason} onChange={e => { setReason(e.target.value); setErr(''); }}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">Choisir une raison…</option>
                      {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Description (optionnel)</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Décrivez le problème en détail…" />
                  </div>
                  {err && <p className="text-sm text-red-600">{err}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                    {loading ? 'Envoi…' : 'Envoyer le signalement'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
