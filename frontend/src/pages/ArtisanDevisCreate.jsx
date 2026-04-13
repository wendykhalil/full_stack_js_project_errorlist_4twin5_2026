import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, FileSignature, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import SimpleFooter from "../components/Footer";
import { apiFetch, suggestQuoteFromProject } from "../auth/api";
import PageShell from '../components/PageShell';
import { useFormValidation, rules } from '../hooks/useFormValidation';
import { useServerErrors } from '../hooks/useServerErrors';
import FieldError from '../components/FieldError';

const emptyLine = { description: "", quantity: 1, unitPrice: 0 };

export default function ArtisanDevisCreate() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(state?.projectId || "");
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const { errors: formErrors, validate } = useFormValidation({
    projectId: [rules.required('Veuillez sélectionner un projet')],
  });
  const { fieldErrors: serverErrors, globalError: serverGlobalError, handleError, clearErrors } = useServerErrors();

  useEffect(() => {
    const run = async () => {
      try {
        const data = await apiFetch('/projects/my', { token });
        setProjects(data?.items || []);
      } catch {
        setProjects([]);
      }
    };
    if (token) run();
  }, [token]);

  useEffect(() => {
    if (state?.projectId && projects.some((project) => project._id === state.projectId)) {
      setProjectId(state.projectId);
    }
  }, [projects, state]);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === projectId) || null,
    [projects, projectId]
  );

  const totals = useMemo(() => {
    const subTotal = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0);
    const taxAmount = subTotal * 0.19;
    return { subTotal, taxAmount, total: subTotal + taxAmount };
  }, [lines]);

  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  };

  const autofillWithAI = async () => {
    if (!projectId) {
      setError('Sélectionnez d\'abord un projet.');
      return;
    }
    setAiLoading(true);
    setError('');
    setInfo('');
    try {
      const response = await suggestQuoteFromProject({ token, projectId });
      const aiData = response?.data || {};
      const suggestedLines = (aiData.lines || []).map((line) => ({
        description: line.description || '',
        quantity: Number(line.quantity || 1),
        unitPrice: Number(line.unitPrice || 0),
      }));
      if (suggestedLines.length) {
        setLines(suggestedLines);
      }
      setInfo(aiData.summary || 'Lignes de devis générées avec l’assistant IA.');
    } catch (err) {
      setError(err.message || 'Génération IA impossible');
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    setInfo("");
    setError("");

    if (!validate({ projectId })) {
      setLoading(false);
      return;
    }

    // Validate line items
    const lineErrors = [];
    lines.forEach((line, i) => {
      if (!line.description.trim()) lineErrors.push(`Ligne ${i + 1}: description requise`);
      if (!line.quantity || Number(line.quantity) <= 0) lineErrors.push(`Ligne ${i + 1}: quantité invalide`);
      if (!line.unitPrice || Number(line.unitPrice) < 0) lineErrors.push(`Ligne ${i + 1}: prix unitaire invalide`);
    });
    if (lineErrors.length > 0) {
      setError(lineErrors.join(' | '));
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch('/documents/quotes', {
        token,
        method: 'POST',
        body: { projectId, lines },
      });
      if (!response?.ok) throw new Error(response?.message || 'Création du devis impossible');
      setInfo('Devis généré avec succès.');
      setTimeout(() => navigate('/artisan/factures'), 900);
    } catch (err) {
      handleError(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-none px-4 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <FileSignature className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Créer un devis</h1>
              <p className="mt-1 text-sm text-slate-500">Générez un devis professionnel et laissez l’IA vous proposer des lignes prêtes à ajuster.</p>
              {state?.projectTitle ? <p className="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Projet sélectionné: {state.projectTitle}</p> : null}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2 text-indigo-600 shadow-sm"><Bot className="h-4 w-4" /></div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Assistant devis</p>
                <p className="mt-1 text-slate-600">Choisissez un projet puis cliquez sur <strong>Auto-remplir avec IA</strong> pour générer une base réaliste de prestations, matériaux et main d’œuvre.</p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">Projet</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={`w-full rounded-xl border ${formErrors.projectId || serverErrors.projectId ? 'border-red-400' : 'border-slate-200'} bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none`}>
                <option value="">Sélectionner un projet</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>{project.title} — {project.location?.city || 'Sans ville'}</option>
                ))}
              </select>
              <FieldError error={formErrors.projectId || serverErrors.projectId} />
                <option value="">Sélectionner un projet</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>{project.title} — {project.location?.city || 'Sans ville'}</option>
                ))}
              </select>
              {selectedProject ? (
                <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div><span className="font-semibold text-slate-900">Catégorie:</span> {selectedProject.category || '—'}</div>
                    <div><span className="font-semibold text-slate-900">Budget:</span> {selectedProject.budgetTND ? `${Number(selectedProject.budgetTND).toLocaleString()} TND` : '—'}</div>
                    <div><span className="font-semibold text-slate-900">Surface:</span> {selectedProject.surfaceM2 ? `${selectedProject.surfaceM2} m²` : '—'}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={autofillWithAI} disabled={!projectId || aiLoading} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Auto-remplir avec IA
              </button>
              <button type="button" onClick={() => setLines((prev) => [...prev, { ...emptyLine }])} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Plus className="h-4 w-4" /> Ajouter une ligne
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.7fr,0.7fr,0.8fr,auto]">
                  <input value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} placeholder="Description" className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
                  <input value={line.quantity} onChange={(e) => updateLine(index, 'quantity', e.target.value)} type="text" placeholder="Qté" className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
                  <input value={line.unitPrice} onChange={(e) => updateLine(index, 'unitPrice', e.target.value)} type="text" placeholder="Prix unitaire" className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
                  <button type="button" onClick={() => setLines((prev) => prev.filter((_, i) => i !== index || prev.length === 1))} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-slate-600 hover:bg-slate-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

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
    </PageShell>
  );
}

