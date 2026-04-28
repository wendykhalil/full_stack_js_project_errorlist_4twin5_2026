import React, { useEffect, useMemo, useState } from "react";
import { Bot, FileSignature, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import ReadCardButton from '../components/ReadCardButton';
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import SimpleFooter from "../components/Footer";
import { apiFetch, suggestQuoteFromProject } from "../auth/api";
import PageShell from "../components/PageShell";
import { useFormValidation, rules } from "../hooks/useFormValidation";
import { useServerErrors } from "../hooks/useServerErrors";
import FieldError from "../components/FieldError";
import { Hint } from "../components/MouseTooltip";

const emptyLine = { description: "", quantity: 1, unitPrice: 0 };
const TAX_RATE = 0.19;

const formatMoney = (value) => `${Number(value || 0).toFixed(3)} TND`;
const hasMeaningfulText = (value) => String(value || "").trim().length >= 12;

function sanitizeNumber(value, fallback = 0) {
  const normalized = String(value ?? "")
    .replace(/,/g, ".")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeLine(line, index, selectedProject) {
  const projectTitle = selectedProject?.title || "le projet";
  const projectCategory = selectedProject?.category || "travaux";
  const baseDescription = String(line?.description || "").trim();
  const quantity = Math.max(1, sanitizeNumber(line?.quantity, 1));
  const unitPrice = Math.max(0, sanitizeNumber(line?.unitPrice, 0));

  let description = baseDescription;
  if (!hasMeaningfulText(description)) {
    const defaultDescriptions = [
      `Étude technique détaillée et préparation du chantier pour ${projectTitle}, avec vérification des contraintes du site et planification des ressources.`,
      `Fourniture des matériaux principaux nécessaires aux ${projectCategory.toLowerCase()} de ${projectTitle}, incluant transport, manutention et contrôle qualité.`,
      `Main-d'œuvre qualifiée pour l'exécution des travaux de ${projectCategory.toLowerCase()}, avec pose, ajustement, finitions et nettoyage de la zone.`,
      `Finitions, reprises et contrôle final du lot réalisé pour ${projectTitle}, avec vérification de conformité avant livraison.`,
      `Coordination de chantier, suivi d'avancement et assistance technique pendant la réalisation de ${projectTitle}.`,
    ];
    description = defaultDescriptions[index % defaultDescriptions.length];
  }

  return {
    description,
    quantity,
    unitPrice,
  };
}

function buildDetailedFallbackLines(project) {
  const title = project?.title || "Projet";
  const category = (project?.category || "Travaux généraux").toLowerCase();
  const surface = Math.max(0, sanitizeNumber(project?.surfaceM2, 0));
  const budget = Math.max(0, sanitizeNumber(project?.budgetTND, 0));
  const sizeFactor = surface >= 250 ? 1.35 : surface >= 120 ? 1.15 : 1;
  const budgetFactor = budget >= 50000 ? 1.3 : budget >= 20000 ? 1.12 : 1;
  const factor = Number((sizeFactor * budgetFactor).toFixed(2));

  const lines = [
    {
      description: `Visite technique, relevé des mesures et préparation détaillée du chantier pour ${title}, avec analyse des besoins, vérification des supports existants et organisation des étapes d'intervention.`,
      quantity: 1,
      unitPrice: 180 * factor,
    },
    {
      description: `Protection du chantier, approvisionnement initial et installation logistique pour ${title}, comprenant bâchage, sécurisation de la zone de travail, transport et mise à disposition du matériel.`,
      quantity: 1,
      unitPrice: 220 * factor,
    },
    {
      description: `Fourniture des matériaux principaux pour ${category} de ${title}, avec sélection de consommables adaptés, transport, déchargement et contrôle qualité avant mise en œuvre.`,
      quantity: Math.max(1, Math.ceil(surface / 25) || 2),
      unitPrice: 140 * factor,
    },
    {
      description: `Main-d'œuvre qualifiée pour réalisation des travaux de ${category} sur ${title}, incluant préparation, pose, ajustements, assemblage et exécution selon les règles de l'art.`,
      quantity: Math.max(2, Math.ceil(surface / 20) || 3),
      unitPrice: 160 * factor,
    },
    {
      description: `Finitions, reprises et contrôle final de la prestation sur ${title}, avec corrections mineures, nettoyage de fin de chantier et vérification globale avant livraison.`,
      quantity: 1,
      unitPrice: 190 * factor,
    },
  ];

  return lines.map((line) => ({
    ...line,
    unitPrice: Number(line.unitPrice.toFixed(3)),
  }));
}

function buildDetailedLines(aiLines, selectedProject) {
  const normalizedAi = Array.isArray(aiLines)
    ? aiLines
        .map((line, index) => normalizeLine(line, index, selectedProject))
        .filter((line) => line.description)
    : [];

  if (
    normalizedAi.length >= 3 &&
    normalizedAi.every((line) => hasMeaningfulText(line.description))
  ) {
    return normalizedAi.map((line) => ({
      ...line,
      unitPrice: Number(Math.max(0, line.unitPrice).toFixed(3)),
    }));
  }

  return buildDetailedFallbackLines(selectedProject);
}

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
    projectId: [rules.required("Veuillez sélectionner un projet")],
  });

  const {
    fieldErrors: serverErrors,
    globalError: serverGlobalError,
    handleError,
    clearErrors,
  } = useServerErrors();

  useEffect(() => {
    const run = async () => {
      try {
        const data = await apiFetch("/projects/my", { token });
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
    const subTotal = lines.reduce(
      (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0),
      0
    );
    const taxAmount = subTotal * TAX_RATE;
    return { subTotal, taxAmount, total: subTotal + taxAmount };
  }, [lines]);

  const updateLine = (index, field, value) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;

        if (field === "quantity") {
          return { ...line, quantity: String(value).replace(/[^\d.,]/g, "") };
        }

        if (field === "unitPrice") {
          return { ...line, unitPrice: String(value).replace(/[^\d.,]/g, "") };
        }

        return { ...line, [field]: value };
      })
    );
  };

  const autofillWithAI = async () => {
    if (!projectId) {
      setError("Sélectionnez d'abord un projet.");
      return;
    }

    setAiLoading(true);
    setError("");
    setInfo("");

    try {
      const response = await suggestQuoteFromProject({
        token: token,
        projectId: projectId,
      });

      const aiData = response?.data || {};

      const detailedLines = buildDetailedLines(
        aiData?.lines || [],
        selectedProject
      );

      if (Array.isArray(detailedLines) && detailedLines.length > 0) {
        setLines(detailedLines);
      } else {
        setLines(buildDetailedFallbackLines(selectedProject));
      }

      setInfo(
        aiData?.summary ||
          "Devis généré automatiquement avec des détails."
      );
    } catch (err) {
      console.error(err);
      setLines(buildDetailedFallbackLines(selectedProject));
      setInfo("Assistant IA indisponible → devis généré automatiquement.");
      setError("");
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

    const cleanedLines = lines.map((line, index) =>
      normalizeLine(line, index, selectedProject)
    );

    const lineErrors = [];
    cleanedLines.forEach((line, i) => {
      if (!line.description.trim() || line.description.trim().length < 12) {
        lineErrors.push(`Ligne ${i + 1}: description trop courte`);
      }
      if (!line.quantity || Number(line.quantity) <= 0) {
        lineErrors.push(`Ligne ${i + 1}: quantité invalide`);
      }
      if (Number(line.unitPrice) < 0) {
        lineErrors.push(`Ligne ${i + 1}: prix unitaire invalide`);
      }
    });

    if (lineErrors.length > 0) {
      setError(lineErrors.join(" | "));
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch("/documents/quotes", {
        token,
        method: "POST",
        body: { projectId, lines: cleanedLines },
      });

      if (!response?.ok) {
        throw new Error(response?.message || "Création du devis impossible");
      }

      setLines(cleanedLines);
      setInfo("Devis généré avec succès.");
      setTimeout(() => navigate("/artisan/factures"), 900);
    } catch (err) {
      handleError(err);
      setError(err?.message || "Création du devis impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-none px-4 py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <FileSignature className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    Créer un devis
                  </h1>
                  <ReadCardButton text="Créer un devis - Générez un devis professionnel avec l'aide de l'IA" />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Générez un devis professionnel et laissez l’IA vous proposer
                  des lignes prêtes à ajuster.
                </p>

                {state?.projectTitle ? (
                  <p className="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    Projet sélectionné: {state.projectTitle}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2 text-indigo-600 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Assistant devis</p>
                  <p className="mt-1 text-slate-600">
                    Choisissez un projet puis cliquez sur{" "}
                    <strong>Auto-remplir avec IA</strong> pour générer une base
                    réaliste de prestations, matériaux et main d’œuvre.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Projet
                </label>

                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={`w-full rounded-xl border ${
                    formErrors.projectId || serverErrors.projectId
                      ? "border-red-400"
                      : "border-slate-200"
                  } bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none`}
                >
                  <option value="">Sélectionner un projet</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.title} — {project.location?.city || "Sans ville"}
                    </option>
                  ))}
                </select>

                <FieldError error={formErrors.projectId || serverErrors.projectId} />

                {selectedProject ? (
                  <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <span className="font-semibold text-slate-900">
                          Catégorie:
                        </span>{" "}
                        {selectedProject.category || "—"}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">
                          Budget:
                        </span>{" "}
                        {selectedProject.budgetTND
                          ? `${Number(selectedProject.budgetTND).toLocaleString()} TND`
                          : "—"}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">
                          Surface:
                        </span>{" "}
                        {selectedProject.surfaceM2
                          ? `${selectedProject.surfaceM2} m²`
                          : "—"}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={autofillWithAI}
                  disabled={!projectId || aiLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Auto-remplir avec IA
                </button>

                <button
                  type="button"
                  onClick={() => setLines((prev) => [...prev, { ...emptyLine }])}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" /> Ajouter une ligne
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.7fr,0.7fr,0.8fr,auto]"
                  >
                    <textarea
                      value={line.description}
                      onChange={(e) =>
                        updateLine(index, "description", e.target.value)
                      }
                      placeholder="Description détaillée"
                      rows={3}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    />

                    <input
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(index, "quantity", e.target.value)
                      }
                      inputMode="decimal"
                      type="text"
                      placeholder="Qté"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    />

                    <input
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(index, "unitPrice", e.target.value)
                      }
                      inputMode="decimal"
                      type="text"
                      placeholder="Prix unitaire"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setLines((prev) =>
                          prev.length === 1
                            ? prev
                            : prev.filter((_, i) => i !== index)
                        )
                      }
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-slate-600 hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <strong>{formatMoney(totals.subTotal)}</strong>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>TVA 19%</span>
                  <strong>{formatMoney(totals.taxAmount)}</strong>
                </div>
                <div className="mt-2 flex justify-between text-base">
                  <span>Total</span>
                  <strong>{formatMoney(totals.total)}</strong>
                </div>
              </div>

              {(error || serverGlobalError) && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error || serverGlobalError}
                </div>
              )}

              {info && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {info}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-700 px-5 py-4 text-sm font-semibold text-white shadow hover:bg-indigo-800 disabled:opacity-60"
              >
                {loading ? "Création..." : "Générer le devis"}
              </button>
            </form>
          </div>
        </main>

        <SimpleFooter />
      </div>
    </PageShell>
  );
}