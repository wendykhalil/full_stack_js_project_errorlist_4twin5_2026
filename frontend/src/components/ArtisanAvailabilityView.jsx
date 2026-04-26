import React, { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";
import { apiFetch } from "../auth/api";

const STATUS = {
  AVAILABLE: {
    label: "Disponible",
    dot: "bg-emerald-400",
    cell: "bg-emerald-50 border-emerald-200 text-emerald-800",
    badge: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  BUSY: {
    label: "Occupé",
    dot: "bg-orange-400",
    cell: "bg-orange-50 border-orange-200 text-orange-800",
    badge: "bg-orange-100 text-orange-700",
    icon: Clock,
    iconColor: "text-orange-500",
  },
  BOOKED: {
    label: "Réservé",
    dot: "bg-red-400",
    cell: "bg-red-50 border-red-200 text-red-800",
    badge: "bg-red-100 text-red-700",
    icon: XCircle,
    iconColor: "text-red-500",
  },
};

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function toKey(date) { return date.toISOString().slice(0, 10); }

function monthDays(year, month) {
  const days = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

export default function ArtisanAvailabilityView({ artisanId }) {
  const now = new Date();
  const today = toKey(now);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  useEffect(() => {
    if (!artisanId) return;
    setLoading(true);
    apiFetch(`/availability/artisan/${artisanId}?month=${monthStr}`)
      .then(res => {
        const map = {};
        (res.items || []).forEach(item => { map[item.date.slice(0, 10)] = item.status; });
        setAvailability(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artisanId, monthStr]);

  const days = monthDays(year, month);
  const monthLabel = new Date(year, month).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Stats
  const stats = useMemo(() => {
    const counts = { AVAILABLE: 0, BUSY: 0, BOOKED: 0 };
    Object.values(availability).forEach(s => { if (counts[s] !== undefined) counts[s]++; });
    return counts;
  }, [availability]);

  // Next available date from today
  const nextAvailable = useMemo(() => {
    const entries = Object.entries(availability)
      .filter(([date, status]) => status === 'AVAILABLE' && date >= today)
      .sort(([a], [b]) => a.localeCompare(b));
    return entries[0]?.[0] || null;
  }, [availability, today]);

  const hasAny = Object.keys(availability).length > 0;
  if (!loading && !hasAny && month === now.getMonth() && year === now.getFullYear()) return null;

  function prev() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-500" />
          <h2 className="text-xl font-semibold text-slate-900">Disponibilités</h2>
        </div>
        {nextAvailable && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Prochain dispo: {new Date(nextAvailable + 'T00:00:00').toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </div>
        )}
      </div>

      {/* Stats row */}
      {hasAny && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {Object.entries(STATUS).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <div key={key} className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${meta.badge}`}>
                <Icon className={`h-5 w-5 shrink-0 ${meta.iconColor}`} />
                <div>
                  <p className="text-lg font-bold leading-none">{stats[key]}</p>
                  <p className="text-xs mt-0.5 opacity-80">{meta.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <button onClick={prev} className="rounded-xl p-2 hover:bg-white hover:shadow-sm transition-all">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <span className="font-semibold text-slate-800 capitalize">{monthLabel}</span>
          <button onClick={next} className="rounded-xl p-2 hover:bg-white hover:shadow-sm transition-all">
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {DAY_NAMES.map((d, i) => (
            <div key={i} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Chargement…</div>
        ) : (
          <div className="grid grid-cols-7 p-2 gap-1">
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="h-12" />;
              const key = toKey(day);
              const status = availability[key];
              const meta = STATUS[status];
              const isToday = key === today;
              const isPast = key < today;

              return (
                <div
                  key={key}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  className={`
                    relative h-12 flex flex-col items-center justify-center rounded-xl text-sm transition-all cursor-default
                    ${meta ? `border ${meta.cell} font-semibold` : isPast ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-50'}
                    ${isToday && !meta ? 'ring-2 ring-indigo-400 ring-offset-1 font-bold text-indigo-600' : ''}
                    ${isToday && meta ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}
                  `}
                >
                  <span>{day.getDate()}</span>
                  {meta && (
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  )}
                  {/* Tooltip on hover */}
                  {hovered === key && meta && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg">
                      {meta.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-slate-100 bg-slate-50">
          {Object.entries(STATUS).map(([, val]) => (
            <span key={val.label} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${val.dot}`} />
              {val.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-indigo-400 bg-white" />
            Aujourd'hui
          </span>
        </div>
      </div>
    </div>
  );
}
