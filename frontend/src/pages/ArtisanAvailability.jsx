import React, { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, FileText, Check, X, Zap, AlertCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import PageShell from "../components/PageShell";
import { Hint } from "../components/MouseTooltip";

const STATUS = {
  AVAILABLE: { 
    label: "Disponible", 
    icon: "✓",
    color: "bg-emerald-500", 
    lightColor: "bg-emerald-100",
    text: "text-emerald-700",
    darkText: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    glow: "shadow-lg shadow-emerald-200",
    gradient: "from-emerald-400 to-emerald-600"
  },
  BUSY:      { 
    label: "Occupé",
    icon: "●",
    color: "bg-orange-500",
    lightColor: "bg-orange-100",
    text: "text-orange-700",
    darkText: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    glow: "shadow-lg shadow-orange-200",
    gradient: "from-orange-400 to-orange-600"
  },
  BOOKED:    { 
    label: "Réservé",
    icon: "⊕",
    color: "bg-red-500",
    lightColor: "bg-red-100",
    text: "text-red-700",
    darkText: "text-red-600",
    bg: "bg-red-50 border-red-200",
    glow: "shadow-lg shadow-red-200",
    gradient: "from-red-400 to-red-600"
  },
};

const TIMES = [
  { id: "morning", label: "Matin", icon: "🌅", range: "08:00 - 12:00" },
  { id: "afternoon", label: "Après-midi", icon: "☀️", range: "12:00 - 17:00" },
  { id: "evening", label: "Soir", icon: "🌙", range: "17:00 - 21:00" },
];

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthDays(year, month) {
  const days = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

export default function ArtisanAvailability() {
  const { token } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [timeSlots, setTimeSlots] = useState({ morning: false, afternoon: false, evening: false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [viewMode, setViewMode] = useState("month"); // month or week
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterStatus, setFilterStatus] = useState(null); // null, AVAILABLE, BUSY, BOOKED
  const [selectedRange, setSelectedRange] = useState(null); // for drag range selection

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  async function load() {
    try {
      setLoading(true);
      const res = await apiFetch(`/availability/my?month=${monthStr}`, { token });
      const map = {};
      (res.items || []).forEach(item => {
        map[item.date.slice(0, 10)] = { status: item.status, note: item.note || "", timeSlots: item.timeSlots || {} };
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
      setErr("");
      if (status === null) {
        await apiFetch(`/availability/${selected}`, { token, method: "DELETE" });
        setAvailability(prev => { const n = { ...prev }; delete n[selected]; return n; });
      } else {
        await apiFetch("/availability", { 
          token, 
          method: "POST", 
          body: { date: selected, status, note, timeSlots } 
        });
        setAvailability(prev => ({ ...prev, [selected]: { status, note, timeSlots } }));
      }
      setSelected(null);
      setNote("");
      setTimeSlots({ morning: false, afternoon: false, evening: false });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  function handleSelectDate(dateKey) {
    if (selected === dateKey) {
      setSelected(null);
      setNote("");
      setTimeSlots({ morning: false, afternoon: false, evening: false });
    } else {
      setSelected(dateKey);
      const existing = availability[dateKey];
      setNote(existing?.note || "");
      setTimeSlots(existing?.timeSlots || { morning: false, afternoon: false, evening: false });
    }
  }

  // Get week days for week view
  const getDisplayWeek = () => {
    const today = new Date(year, month, 1 + weekOffset * 7);
    const monday = new Date(today);
    monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  const days = viewMode === "month" ? monthDays(year, month) : getDisplayWeek();
  const monthLabel = new Date(year, month).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const weekLabel = viewMode === "week" ? (() => {
    const weekDays = getDisplayWeek();
    const start = weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const end = weekDays[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return `${start} - ${end}`;
  })() : "";
  
  // Calculate statistics
  const totalDays = days.filter(d => d).length;
  const markedDays = Object.keys(availability).filter(k => {
    const [y, m, d] = k.split("-").map(Number);
    return y === year && m === month + 1;
  }).length;
  const availabilityPercent = totalDays > 0 ? Math.round((markedDays / totalDays) * 100) : 0;

  const filteredDays = Object.entries(availability).filter(([k, v]) => {
    if (!filterStatus) return true;
    return v.status === filterStatus;
  }).length;

  // Count statuses
  const statusCounts = {
    AVAILABLE: Object.values(availability).filter(v => v.status === "AVAILABLE").length,
    BUSY: Object.values(availability).filter(v => v.status === "BUSY").length,
    BOOKED: Object.values(availability).filter(v => v.status === "BOOKED").length,
  };

  function prevMonth() {
    if (viewMode === "week") {
      if (weekOffset <= 0) {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
        setWeekOffset(3); // Last week of previous month
      } else {
        setWeekOffset(w => w - 1);
      }
    } else {
      if (month === 0) { setYear(y => y - 1); setMonth(11); }
      else setMonth(m => m - 1);
    }
  }

  function nextMonth() {
    if (viewMode === "week") {
      setWeekOffset(w => w + 1);
    } else {
      if (month === 11) { setYear(y => y + 1); setMonth(0); }
      else setMonth(m => m + 1);
    }
  }

  return (
    <PageShell title="Disponibilités">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Mon calendrier</h1>
                <p className="mt-2 text-slate-600">Gérez vos disponibilités et vos réservations</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setViewMode("month"); setWeekOffset(0); }}
                  className={`rounded-xl px-4 py-2 font-medium transition-all ${
                    viewMode === "month" 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200" 
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}>
                  Mois
                </button>
                <button onClick={() => setViewMode("week")}
                  className={`rounded-xl px-4 py-2 font-medium transition-all ${
                    viewMode === "week" 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200" 
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}>
                  Semaine
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Calendar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const meta = STATUS[status];
                  return (
                    <button key={status} onClick={() => setFilterStatus(filterStatus === status ? null : status)}
                      className={`group rounded-2xl border-2 p-4 transition-all ${
                        filterStatus === status
                          ? `border-blue-400 bg-blue-50 shadow-lg shadow-blue-100`
                          : `border-slate-200 bg-white hover:border-slate-300 hover:shadow-md`
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2 ${meta.lightColor}`}>
                          <span className={`text-lg font-bold ${meta.text}`}>{meta.icon}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-600">{meta.label}</p>
                          <p className="text-2xl font-bold text-slate-900">{count}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-slate-900">Couverture du mois</p>
                  <p className="text-sm font-bold text-blue-600">{availabilityPercent}%</p>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-600`}
                    style={{ width: `${availabilityPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{markedDays} jour(s) sur {totalDays}</p>
              </div>

              {/* Calendar Card */}
              <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200">
                  <button onClick={prevMonth} className="group rounded-xl p-3 hover:bg-white shadow-sm hover:shadow-md transition-all">
                    <ChevronLeft className="h-5 w-5 text-slate-700 group-hover:text-blue-600" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-900 capitalize min-w-max">
                    {viewMode === "month" ? monthLabel : weekLabel}
                  </h2>
                  <button onClick={nextMonth} className="group rounded-xl p-3 hover:bg-white shadow-sm hover:shadow-md transition-all">
                    <ChevronRight className="h-5 w-5 text-slate-700 group-hover:text-blue-600" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
                  {["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"].map(d => (
                    <div key={d} className="py-4 text-center text-sm font-semibold text-slate-500">{d}</div>
                  ))}
                </div>

                {/* Calendar Grid */}
                {loading ? (
                  <div className="py-24 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-blue-600" />
                    <p className="mt-3 text-slate-500">Chargement du calendrier…</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-px bg-slate-100 p-px">
                    {days.map((day, i) => {
                      if (!day) return <div key={`empty-${i}`} className="min-h-28 bg-slate-50" />;
                      const key = toKey(day);
                      const data = availability[key];
                      const status = data?.status;
                      const dayNote = data?.note;
                      const meta = STATUS[status];
                      const isSelected = selected === key;
                      const isToday = toKey(now) === key;
                      const isPast = day < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      
                      // Build tooltip text
                      let tooltipText = undefined;
                      if (meta) {
                        let tooltipParts = [meta.label];
                        if (dayNote) tooltipParts.push(`"${dayNote}"`);
                        
                        const selectedTimes = Object.entries(data?.timeSlots || {})
                          .filter(([k, v]) => v)
                          .map(([k]) => {
                            const timeObj = TIMES.find(t => t.id === k);
                            return timeObj ? `${timeObj.icon} ${timeObj.label}` : '';
                          })
                          .filter(Boolean);
                        
                        if (selectedTimes.length > 0) {
                          tooltipParts.push(`Horaires: ${selectedTimes.join(', ')}`);
                        }
                        tooltipText = tooltipParts.join(' • ');
                      }
                      
                      return (
                        <Hint key={key} text={tooltipText}>
                        <button onClick={() => !isPast && handleSelectDate(key)}
                          disabled={isPast}
                          className={`relative min-h-28 flex flex-col items-center justify-center transition-all bg-white group
                            ${isPast ? "opacity-40 cursor-not-allowed bg-slate-50" : "hover:bg-blue-50 cursor-pointer"}
                            ${isSelected ? "ring-2 ring-inset ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50" : ""}
                            ${isToday && !isSelected ? "ring-2 ring-inset ring-amber-400 bg-amber-50/30" : ""}`}>
                          
                          {/* Today Badge */}
                          {isToday && (
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                              Aujourd'hui
                            </div>
                          )}

                          {/* Date Number */}
                          <span className={`text-lg font-bold transition-colors ${
                            meta ? meta.text : "text-slate-700"
                          }`}>{day.getDate()}</span>

                          {/* Status Indicator */}
                          {meta && (
                            <div className={`mt-2 h-3 w-3 rounded-full ${meta.color} ${meta.glow} transition-all`} />
                          )}

                          {/* Hover Hint */}
                          {meta && dayNote && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 left-2 right-2 text-xs truncate text-slate-600 bg-white rounded px-2 py-1 shadow-sm">
                              {meta.label}
                            </div>
                          )}
                        </button>
                        </Hint>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Details Panel */}
            <div className="lg:col-span-1">
              {selected && (
                <div className="sticky top-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Card Header */}
                  <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-xl bg-blue-100 p-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Date sélectionnée</p>
                        <p className="text-lg font-bold text-slate-900">
                          {new Date(selected).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Selector - Segmented */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</p>
                    <div className="flex gap-2">
                      {Object.entries(STATUS).map(([key, val]) => (
                        <Hint key={key} text={
                          key === 'AVAILABLE' ? 'Disponible pour interventions' :
                          key === 'BUSY' ? 'Déjà engagé' :
                          'Réservé pour client'
                        }>
                        <button onClick={() => handleSet(key)} disabled={saving}
                          className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                            val.bg
                          } hover:shadow-md disabled:opacity-50`}>
                          {val.icon} {val.label}
                        </button>
                        </Hint>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Clock className="h-4 w-4" /> Horaires
                    </p>
                    <div className="space-y-2">
                      {TIMES.map(time => (
                        <label key={time.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={timeSlots[time.id] || false}
                            onChange={(e) => setTimeSlots({...timeSlots, [time.id]: e.target.checked})}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700">{time.icon} {time.label}</p>
                            <p className="text-xs text-slate-500">{time.range}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <FileText className="h-4 w-4" /> Raison / Rappel
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ex: Réunion client, Chantier en cours, Congés..."
                      maxLength={200}
                      className="w-full h-20 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="mt-1 text-xs text-slate-500">{note.length}/200 caractères</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {Object.entries(STATUS).map(([key, val]) => (
                      <button key={key} onClick={() => handleSet(key)} disabled={saving}
                        className={`flex-1 rounded-xl py-3 font-semibold transition-all flex items-center justify-center gap-2
                          ${saving ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg hover:-translate-y-0.5"}
                          ${val.bg}`}>
                        {saving ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {saving ? "Sauvegarde..." : val.label}
                      </button>
                    ))}
                  </div>

                  {/* Delete Button */}
                  {availability[selected] && (
                    <button onClick={() => handleSet(null)} disabled={saving}
                      className="w-full rounded-xl py-2 px-3 font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50">
                      Effacer ce jour
                    </button>
                  )}

                  {/* Error Message */}
                  {err && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">{err}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!selected && (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-slate-400" />
                  <p className="mt-3 font-semibold text-slate-700">Sélectionnez un jour</p>
                  <p className="mt-1 text-sm text-slate-500">Cliquez sur une date pour ajouter votre disponibilité</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
