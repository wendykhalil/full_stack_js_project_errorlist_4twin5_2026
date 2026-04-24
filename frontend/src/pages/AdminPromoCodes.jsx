import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Tag, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from "../auth/api";
import FieldError from "../components/FieldError";
import { useServerErrors } from "../hooks/useServerErrors";
import { Hint } from "../components/MouseTooltip";

const emptyForm = {
  code: "", discountPercent: "", maxUses: "", expiresAt: "", isActive: true, appliesTo: "both",
};

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function PromoForm({ form, setForm, onSubmit, loading, submitLabel }) {
  const { fieldErrors, globalError, handleError, clearErrors } = useServerErrors();

  function handleSubmit(e) {
    e.preventDefault();
    clearErrors();
    Promise.resolve(onSubmit(e)).catch(handleError);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Code *</label>
        <Hint text="Le code que les utilisateurs saisiront lors du paiement">
        <input value={form.code} onChange={e => { setForm(s => ({ ...s, code: e.target.value.toUpperCase() })); clearErrors(); }}
          className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors.code ? 'border-red-400' : 'border-slate-200'}`}
          placeholder="EX: SUMMER20" />
        </Hint>
        <FieldError error={fieldErrors.code} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Remise (%) *</label>
          <Hint text="Pourcentage de réduction appliqué au montant total">
          <input value={form.discountPercent} onChange={e => { setForm(s => ({ ...s, discountPercent: e.target.value })); clearErrors(); }}
            className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors.discountPercent ? 'border-red-400' : 'border-slate-200'}`}
            placeholder="20" />
          </Hint>
          <FieldError error={fieldErrors.discountPercent} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Utilisations max</label>
          <Hint text="Nombre maximum d'utilisations avant expiration automatique">
          <input value={form.maxUses} onChange={e => { setForm(s => ({ ...s, maxUses: e.target.value })); clearErrors(); }}
            className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors.maxUses ? 'border-red-400' : 'border-slate-200'}`}
            placeholder="Illimité" />
          </Hint>
          <FieldError error={fieldErrors.maxUses} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Date d'expiration</label>
        <Hint text="Date après laquelle le code ne sera plus valide">
        <input value={form.expiresAt} onChange={e => setForm(s => ({ ...s, expiresAt: e.target.value }))}
          type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </Hint>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Applicable sur</label>
        <select value={form.appliesTo} onChange={e => setForm(s => ({ ...s, appliesTo: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="both">Les deux plans</option>
          <option value="monthly">Mensuel uniquement</option>
          <option value="yearly">Annuel uniquement</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="isActive" checked={form.isActive}
          onChange={e => setForm(s => ({ ...s, isActive: e.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
        <label htmlFor="isActive" className="text-sm text-slate-700">Actif</label>
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
        {loading ? "Enregistrement…" : submitLabel}
      </button>
      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}
    </form>
  );
}

export default function AdminPromoCodes() {
  const { token } = useAuth();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await getPromoCodes({ token });
      setCodes(res.codes || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await createPromoCode({ token, data: form });
      setCreateOpen(false);
      setForm(emptyForm);
      load();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await updatePromoCode({ token, id: editItem._id, data: form });
      setEditItem(null);
      load();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Supprimer ce code promo ?")) return;
    try {
      await deletePromoCode({ token, id });
      load();
    } catch (e) { setErr(e.message); }
  }

  async function toggleActive(item) {
    try {
      await updatePromoCode({ token, id: item._id, data: { isActive: !item.isActive } });
      load();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="mx-auto max-w-none space-y-7 p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Codes Promo</h1>
          <p className="mt-1.5 text-base text-slate-500">Gérez les remises pour les abonnements</p>
        </div>
        <Hint text="Créer un nouveau code promotionnel">
        <button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Nouveau code
        </button>
        </Hint>
      </div>

      {err && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>}

      {loading ? (
        <div className="py-16 text-center text-slate-400">Chargement…</div>
      ) : codes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
          <Tag className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-slate-500">Aucun code promo créé.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-[15px]">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3.5 text-left">Code</th>
                <th className="px-5 py-3.5 text-left">Remise</th>
                <th className="px-5 py-3.5 text-left">Utilisations</th>
                <th className="px-5 py-3.5 text-left">Expiration</th>
                <th className="px-5 py-3.5 text-left">Plan</th>
                <th className="px-5 py-3.5 text-left">Statut</th>
                <th className="px-5 py-3.5 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.map(c => {
                const expired = c.expiresAt && new Date() > new Date(c.expiresAt);
                const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
                return (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-mono font-semibold text-slate-900">{c.code}</td>
                    <td className="px-5 py-4 text-emerald-600 font-semibold">{c.discountPercent}%</td>
                    <td className="px-5 py-4 text-slate-600">
                      {c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ' / ∞'}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("fr-TN") : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-500 capitalize">{c.appliesTo}</td>
                    <td className="px-5 py-4">
                      {expired || exhausted ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                          {expired ? "Expiré" : "Épuisé"}
                        </span>
                      ) : c.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Actif</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">Inactif</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Hint text="Activer ou désactiver ce code sans le supprimer">
                        <button onClick={() => toggleActive(c)} title={c.isActive ? "Désactiver" : "Activer"}
                          className="rounded-lg p-1.5 hover:bg-slate-100">
                          {c.isActive ? <XCircle className="h-4 w-4 text-slate-400" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        </button>
                        </Hint>
                        <Hint text="Modifier les paramètres de ce code promo">
                        <button onClick={() => { setEditItem(c); setForm({ code: c.code, discountPercent: c.discountPercent, maxUses: c.maxUses || "", expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "", isActive: c.isActive, appliesTo: c.appliesTo }); }}
                          className="rounded-lg p-1.5 hover:bg-slate-100">
                          <Pencil className="h-4 w-4 text-slate-400" />
                        </button>
                        </Hint>
                        <Hint text="Supprimer définitivement ce code promo">
                        <button onClick={() => handleDelete(c._id)}
                          className="rounded-lg p-1.5 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                        </button>
                        </Hint>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} title="Nouveau code promo" onClose={() => setCreateOpen(false)}>
        <PromoForm form={form} setForm={setForm} onSubmit={handleCreate} loading={saving} submitLabel="Créer le code" />
      </Modal>

      <Modal open={!!editItem} title="Modifier le code" onClose={() => setEditItem(null)}>
        <PromoForm form={form} setForm={setForm} onSubmit={handleUpdate} loading={saving} submitLabel="Enregistrer" />
      </Modal>
    </div>
  );
}
