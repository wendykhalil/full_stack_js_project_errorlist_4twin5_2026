import React, { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, FileText, Check, CheckCircle2, XCircle, AlertCircle, Sun, Moon } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import PageShell from "../components/PageShell";
import SimpleFooter from "../components/Footer";
import { Hint } from "../components/MouseTooltip";

const STATUS = {
  AVAILABLE: {
    label: "Disponible",
    icon: CheckCircle2,
    color: "text-emerald-500",
    lightColor: "bg-emerald-100",
    text: "text-emerald-700",
    darkText: "text-emerald-400",
    bg: "bg-emerald-50 border-emerald-200",
    glow: "shadow-lg shadow-emerald-200",
    gradient: "from-emerald-400 to-emerald-600",
    iconGradient: "icon-gradient-available",
    iconBg: "icon-glow-bg-available",
    badgeClass: "status-icon-badge-available",
  },
  BUSY: {
    label: "Occupé",
    icon: Clock,
    color: "text-orange-500",
    lightColor: "bg-orange-100",
    text: "text-orange-700",
    darkText: "text-orange-400",
    bg: "bg-orange-50 border-orange-200",
    glow: "shadow-lg shadow-orange-200",
    gradient: "from-orange-400 to-orange-600",
    iconGradient: "icon-gradient-busy",
    iconBg: "icon-glow-bg-busy",
    badgeClass: "status-icon-badge-busy",
  },
  BOOKED: {
    label: "Réservé",
    icon: XCircle,
    color: "text-red-500",
    lightColor: "bg-red-100",
    text: "text-red-700",
    darkText: "text-red-400",
    bg: "bg-red-50 border-red-200",
    glow: "shadow-lg shadow-red-200",
    gradient: "from-red-400 to-red-600",
    iconGradient: "icon-gradient-booked",
    iconBg: "icon-glow-bg-booked",
    badgeClass: "status-icon-badge-booked",
  },
};

const TIMES = [
  { id: "morning", label: "Matin", icon: Sun, emoji: "🌅", iconGradient: "icon-gradient-primary", range: "08:00 - 12:00" },
  { id: "afternoon", label: "Après-midi", icon: Sun, emoji: "☀️", iconGradient: "icon-gradient-secondary", range: "12:00 - 17:00" },
  { id: "evening", label: "Soir", icon: Moon, emoji: "🌙", iconGradient: "icon-gradient-primary", range: "17:00 - 21:00" },
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
  const [viewMode, setViewMode] = useState("month");
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterStatus, setFilterStatus] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);

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
        setWeekOffset(3);
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

  // Helper to render gradient icon
  const GradientIcon = ({ Icon, gradientClass, size = 20, className = "" }) => (
    <Icon
      className={`${gradientClass} gradient-icon-transition icon-hover ${className}`}
      style={{ width: size, height: size }}
      fill="currentColor"
      strokeWidth={2}
    />
  );

  return (
    <PageShell title="Disponibilités">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900/30 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">Mon calendrier</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Gérez vos disponibilités et vos réservations</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setViewMode("month"); setWeekOffset(0); }}
                  className={`rounded-xl px-4 py-2 font-medium transition-all flex items-center gap-2 ${
                    viewMode === "month"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}>
                  <GradientIcon Icon={Calendar} gradientClass="text-white" size={16} />
                  Mois
                </button>
                <button onClick={() => setViewMode("week")}
                  className={`rounded-xl px-4 py-2 font-medium transition-all flex items-center gap-2 ${
                    viewMode === "week"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}>
                  <GradientIcon Icon={Clock} gradientClass="text-white" size={16} />
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
                  const IconComponent = meta.icon;
                  return (
                    <button key={status} onClick={() => setFilterStatus(filterStatus === status ? null : status)}
                      className={`group rounded-2xl border-2 p-4 transition-all hover:scale-[1.02] ${
                        filterStatus === status
                          ? `border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-lg shadow-blue-100 dark:shadow-blue-900/20`
                          : `border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md`
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2.5 ${meta.lightColor} ${meta.iconBg} transition-all group-hover:scale-110`}>
                          <IconComponent
                            className={`h-6 w-6 ${meta.color} ${meta.iconGradient} transition-all`}
                            fill="currentColor"
                            strokeWidth={2.5}
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{meta.label}</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{count}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <GradientIcon Icon={Calendar} gradientClass="text-blue-600 dark:text-blue-400" size={18} />
                    Couverture du mois
                  </p>
                  <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{availabilityPercent}%</p>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className={`h-full transition-all duration-500 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 shadow-lg`}
                    style={{ width: `${availabilityPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{markedDays} jour(s) sur {totalDays}</p>
              </div>

              {/* Calendar Card */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-800 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
                  <button onClick={prevMonth} className="group rounded-xl p-3 hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:shadow-md transition-all hover:scale-105">
                    <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 capitalize min-w-max flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="currentColor" />
                    {viewMode === "month" ? monthLabel : weekLabel}
                  </h2>
                  <button onClick={nextMonth} className="group rounded-xl p-3 hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:shadow-md transition-all hover:scale-105">
                    <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 bg-slate-50/50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                  {["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"].map(d => (
                    <div key={d} className="py-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                {loading ? (
                  <div className="py-24 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-blue-600 shadow-lg shadow-blue-200" />
                    <p className="mt-3 text-slate-500 dark:text-slate-400">Chargement du calendrier…</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-700 p-px">
                    {days.map((day, i) => {
                      if (!day) return <div key={`empty-${i}`} className="min-h-28 bg-slate-50 dark:bg-slate-800" />;
                      const key = toKey(day);
                      const data = availability[key];
                      const status = data?.status;
                      const dayNote = data?.note;
                      const meta = STATUS[status];
                      const isSelected = selected === key;
                      const isToday = toKey(now) === key;
                      const isPast = day < new Date(now.getFullYear(), now.getMonth(), now.getDate());

                      let tooltipText = undefined;
                      if (meta) {
                        let tooltipParts = [meta.label];
                        if (dayNote) tooltipParts.push(`"${dayNote}"`);

                        const selectedTimes = Object.entries(data?.timeSlots || {})
                          .filter(([k, v]) => v)
                          .map(([k]) => {
                            const timeObj = TIMES.find(t => t.id === k);
                            return timeObj ? `${timeObj.emoji} ${timeObj.label}` : '';
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
                            className={`relative min-h-28 flex flex-col items-center justify-center transition-all bg-white dark:bg-slate-800 group
                              ${isPast ? "opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-900" : "hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer"}
                              ${isSelected ? "ring-2 ring-inset ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50" : ""}
                              ${isToday && !isSelected ? "ring-2 ring-inset ring-amber-400 bg-amber-50/30 dark:bg-amber-950/20" : ""}`}>

                            {/* Today Badge */}
                            {isToday && (
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold shadow-sm">
                                Aujourd'hui
                              </div>
                            )}

                            {/* Date Number */}
                            <span className={`text-lg font-bold transition-colors ${
                              meta ? meta.text : "text-slate-700 dark:text-slate-300"
                            }`}>
                              {day.getDate()}
                            </span>

                            {/* Status Indicator - Enhanced */}
                            {meta && (
                              <div className={`mt-2 flex items-center gap-1.5`}>
                                <div className={`status-icon-badge ${meta.badgeClass} group-hover:scale-110 transition-transform`}>
                                  <meta.icon className="h-3.5 w-3.5" fill="currentColor" />
                                </div>
                                <span className={`text-[10px] font-medium ${meta.darkText} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                  {meta.label}
                                </span>
                              </div>
                            )}

                            {/* Hover Hint */}
                            {meta && dayNote && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 left-2 right-2 text-xs truncate text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded px-2 py-1 shadow-sm border border-slate-200 dark:border-slate-600">
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
                  <div className="rounded-3xl border-2 border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                        <GradientIcon Icon={Calendar} gradientClass="text-white" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Date sélectionnée</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {new Date(selected).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Selector */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Statut
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {Object.entries(STATUS).map(([key, val]) => {
                        const IconComponent = val.icon;
                        return (
                          <Hint key={key} text={
                            key === 'AVAILABLE' ? 'Disponible pour interventions' :
                            key === 'BUSY' ? 'Déjà engagé' :
                            'Réservé pour client'
                          }>
                            <button onClick={() => handleSet(key)} disabled={saving}
                              className={`group w-full rounded-xl py-3 px-4 text-sm font-semibold transition-all flex items-center justify-between hover:scale-[1.02] disabled:hover:scale-100
                                ${val.bg} ${val.glow} border ${filterStatus === key ? 'ring-2 ring-blue-400' : ''}`}>
                              <span className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${val.lightColor} ${val.iconBg} transition-transform group-hover:scale-110`}>
                                  <IconComponent
                                    className={`h-5 w-5 ${val.color} ${val.iconGradient}`}
                                    fill="currentColor"
                                    strokeWidth={2.5}
                                  />
                                </div>
                                {val.label}
                              </span>
                              {!saving && (
                                <div className={`h-5 w-5 rounded-full flex items-center justify-center ${val.lightColor}`}>
                                  <Check className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                                </div>
                              )}
                            </button>
                          </Hint>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                    <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Clock className="h-4 w-4 text-slate-400" />
                      Horaires disponibles
                    </p>
                    <div className="space-y-2.5">
                      {TIMES.map(time => {
                        const IconComponent = time.icon;
                        return (
                          <label key={time.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-all group">
                            <input
                              type="checkbox"
                              checked={timeSlots[time.id] || false}
                              onChange={(e) => setTimeSlots({...timeSlots, [time.id]: e.target.checked})}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 h-5 w-5 cursor-pointer transition-shadow"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <IconComponent className={`h-4 w-4 ${time.iconGradient}`} fill="currentColor" />
                                {time.label}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{time.range}</p>
                            </div>
                            {timeSlots[time.id] && (
                              <div className={`p-1 rounded-full ${time.iconGradient.replace('icon-gradient', 'icon-glow-bg')}`}>
                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                    <label className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <FileText className="h-4 w-4 text-slate-400" />
                      Raison / Rappel
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ex: Réunion client, Chantier en cours, Congés..."
                      maxLength={200}
                      className="w-full h-20 px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{note.length}/200 caractères</p>
                      {note.length > 150 && (
                        <div className="h-1 flex-1 mx-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${note.length > 180 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${(note.length / 200) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {Object.entries(STATUS).map(([key, val]) => {
                      const IconComponent = val.icon;
                      return (
                        <button key={key} onClick={() => handleSet(key)} disabled={saving}
                          className={`group w-full rounded-xl py-3.5 font-semibold transition-all flex items-center justify-center gap-2.5 hover:-translate-y-0.5 disabled:translate-y-0
                            ${saving ? "opacity-60 cursor-not-allowed" : `hover:shadow-xl ${val.glow}`}
                            bg-gradient-to-r ${val.gradient} text-white shadow-md`}>
                          {saving ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <GradientIcon Icon={IconComponent} gradientClass="text-white" size={20} />
                          )}
                          <span className="font-semibold">{saving ? "Sauvegarde..." : val.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Delete Button */}
                  {availability[selected] && (
                    <button onClick={() => handleSet(null)} disabled={saving}
                      className="group w-full rounded-xl py-3 px-4 font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-950/50 hover:border-red-300 dark:hover:border-red-700 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      <AlertCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
                      Effacer ce jour
                    </button>
                  )}

                  {/* Error Message */}
                  {err && (
                    <div className="rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-950/30 px-4 py-3.5 flex gap-3 animate-pulse">
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium">{err}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!selected && (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-10 text-center shadow-sm">
                  <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                    <Calendar className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto" fill="currentColor" />
                  </div>
                  <p className="mt-3 font-bold text-slate-800 dark:text-slate-200 text-lg">Sélectionnez un jour</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                    Cliquez sur une date dans le calendrier pour ajouter ou modifier votre disponibilité
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
    <SimpleFooter />
  );
}
