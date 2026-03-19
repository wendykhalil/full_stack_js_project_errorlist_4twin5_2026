import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileSignature, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import SimpleFooter from "../components/Footer";

const emptyLine = { description: "", quantity: 1, unitPrice: 0 };

export default function ArtisanDevisCreate() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/projects/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setProjects(data?.items || []);
      } catch {
        setProjects([]);
      }
    };
    if (token) run();
  }, [token]);

  const totals = useMemo(() => {
    const subTotal = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0);
    const taxAmount = subTotal * 0.19;
    return { subTotal, taxAmount, total: subTotal + taxAmount };
  }, [lines]);

  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setInfo("");
    setError("");
    try {
      const response = await fetch('http://localhost:5000/api/documents/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, lines }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Création du devis impossible');
      setInfo('Devis généré avec succès.');
      setTimeout(() => navigate('/artisan/factures'), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <FileSignature className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Créer un devis</h1>
              <p className="mt-1 text-sm text-slate-500">Générez un devis directement à partir de l'identifiant du projet.</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">Projet</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none" required>
                <option value="">Sélectionner un projet</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>{project.title} — {project._id}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.7fr,0.7fr,0.8fr,auto]">
                  <input value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} placeholder="Description" className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" required />
                  <input value={line.quantity} onChange={(e) => updateLine(index, 'quantity', e.target.value)} type="number" min="1" placeholder="Qté" className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" required />
                  <input value={line.unitPrice} onChange={(e) => updateLine(index, 'unitPrice', e.target.value)} type="number" min="0" step="0.001" placeholder="Prix unitaire" className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" required />
                  <button type="button" onClick={() => setLines((prev) => prev.filter((_, i) => i !== index || prev.length === 1))} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-slate-600 hover:bg-slate-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => setLines((prev) => [...prev, { ...emptyLine }])} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Plus className="h-4 w-4" /> Ajouter une ligne
            </button>

            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex justify-between"><span>Sous-total</span><strong>{totals.subTotal.toFixed(3)} TND</strong></div>
              <div className="mt-2 flex justify-between"><span>TVA 19%</span><strong>{totals.taxAmount.toFixed(3)} TND</strong></div>
              <div className="mt-2 flex justify-between text-base"><span>Total</span><strong>{totals.total.toFixed(3)} TND</strong></div>
            </div>

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {info && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</div>}

            <button disabled={loading} className="w-full rounded-2xl bg-indigo-700 px-5 py-4 text-sm font-semibold text-white shadow hover:bg-indigo-800 disabled:opacity-60">
              {loading ? 'Création...' : 'Générer le devis'}
            </button>
          </form>
        </div>
      </main>
      <SimpleFooter />
    </div>
  );
}
