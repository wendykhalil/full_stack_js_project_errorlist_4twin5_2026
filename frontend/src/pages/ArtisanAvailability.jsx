import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import PageShell from "../components/PageShell";
import { Hint } from "../components/MouseTooltip";

const STATUS = {
  AVAILABLE: { label: "Disponible", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  BUSY:      { label: "Occupé",     color: "bg-orange-400",  text: "text-orange-700",  bg: "bg-orange-50 border-orange-200" },
  BOOKED:    { label: "Réservé",    color: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50 border-red-200" },
};

function toKey(date) {
  return date.toISOString().slice(0, 10);
}

function monthDays(year, month) {
  const days = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Pad start
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

export default function ArtisanAvailability() {
  const { token } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [availability, setAvailability] = useState({}); // key -> status
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  async function load() {
    try {
      setLoading(true);
      const res = await apiFetch(`/availability/my?month=${monthStr}`, { token });
      const map = {};
      (res.items || []).forEach(item => {
        map[item.date.slice(0, 10)] = item.status;
      });
      setAvailability(map);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [monthStr]);

  async function handleSet(status) {
    if (!selected) return;
    try {
      setSaving(true);
      if (status === null) {
        await apiFetch(`/availability/${selected}`, { token, method: "DELETE" });
        setAvailability(prev => { const n = { ...prev }; delete n[selected]; return n; });
      } else {
        await apiFetch("/availability", { token, method: "POST", body: { date: selected, status } });
        setAvailability(prev => ({ ...prev, [selected]: status }));
      }
      setSelected(null);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  const days = monthDays(year, month);
  const monthLabel = new Date(year, month).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  return (
    <PageShell title="Disponibilités">
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mon calendrier de disponibilité</h1>
          <p className="mt-1 text-sm text-slate-500">Indiquez vos jours disponibles, occupés ou réservés</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS).map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-2 text-sm">
              <span className={`h-3 w-3 rounded-full ${val.color}`} />
              <span className="text-slate-600">{val.label}</span>
            </span>
          ))}
        </div>

        {err && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>}

        {/* Calendar */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <Hint text="Voir le mois précédent">
            <button onClick={prevMonth} className="rounded-xl p-2.5 hover:bg-slate-100">
              <ChevronLeft className="h-6 w-6 text-slate-500" />
            </button>
            </Hint>
            <h2 className="text-lg font-semibold text-slate-900 capitalize">{monthLabel}</h2>
            <Hint text="Voir le mois suivant">
            <button onClick={nextMonth} className="rounded-xl p-2.5 hover:bg-slate-100">
              <ChevronRight className="h-6 w-6 text-slate-500" />
            </button>
            </Hint>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"].map(d => (
              <div key={d} className="py-3 text-center text-sm font-semibold text-slate-400">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          {loading ? (
            <div className="py-16 text-center text-slate-400">Chargement…</div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="h-20" />;
                const key = toKey(day);
                const status = availability[key];
                const meta = STATUS[status];
                const isSelected = selected === key;
                const isPast = day < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return (
                  <button key={key} onClick={() => !isPast && setSelected(isSelected ? null : key)}
                    disabled={isPast}
                    className={`relative h-20 flex flex-col items-center justify-center text-sm transition-all
                      ${isPast ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"}
                      ${isSelected ? "ring-2 ring-inset ring-indigo-500 bg-indigo-50" : ""}
                      border-b border-r border-slate-50`}>
                    <span className={`text-base font-semibold ${meta ? meta.text : "text-slate-700"}`}>{day.getDate()}</span>
                    {meta && <span className={`mt-1 h-2 w-2 rounded-full ${meta.color}`} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action panel */}
        {selected && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm font-medium text-slate-700 mb-3">
              {new Date(selected).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS).map(([key, val]) => (
                <Hint key={key} text={
                  key === 'AVAILABLE' ? 'Marquer ce jour comme disponible pour des interventions' :
                  key === 'BUSY' ? 'Marquer ce jour comme occupé (déjà engagé sur un chantier)' :
                  'Marquer ce jour comme réservé pour un client spécifique'
                }>
                <button onClick={() => handleSet(key)} disabled={saving}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${val.bg} ${val.text} hover:opacity-80 disabled:opacity-50`}>
                  {val.label}
                </button>
                </Hint>
              ))}
              {availability[selected] && (
                <Hint text="Effacer le statut de ce jour et le laisser sans indication">
                <button onClick={() => handleSet(null)} disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                  Effacer
                </button>
                </Hint>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
