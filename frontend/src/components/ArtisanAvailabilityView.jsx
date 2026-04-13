import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { apiFetch } from "../auth/api";

const STATUS = {
  AVAILABLE: { label: "Disponible", color: "bg-emerald-500", dot: "bg-emerald-400" },
  BUSY:      { label: "Occupé",     color: "bg-orange-400",  dot: "bg-orange-400" },
  BOOKED:    { label: "Réservé",    color: "bg-red-500",     dot: "bg-red-400" },
};

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
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);

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
  const hasAny = Object.keys(availability).length > 0;

  function prev() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  if (!loading && !hasAny && month === now.getMonth() && year === now.getFullYear()) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-5 w-5 text-indigo-500" />
        <h2 className="text-xl font-semibold text-slate-900">Disponibilités</h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <button onClick={prev} className="rounded-xl p-1.5 hover:bg-slate-100"><ChevronLeft className="h-4 w-4 text-slate-500" /></button>
          <span className="font-medium text-slate-800 capitalize text-sm">{monthLabel}</span>
          <button onClick={next} className="rounded-xl p-1.5 hover:bg-slate-100"><ChevronRight className="h-4 w-4 text-slate-500" /></button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-50">
          {["D","L","M","M","J","V","S"].map((d, i) => (
            <div key={i} className="py-1.5 text-center text-xs font-semibold text-slate-400">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400 text-sm">Chargement…</div>
        ) : (
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="h-10" />;
              const key = toKey(day);
              const status = availability[key];
              const meta = STATUS[status];
              return (
                <div key={key} className="h-10 flex flex-col items-center justify-center border-b border-r border-slate-50">
                  <span className={`text-xs font-medium ${meta ? "text-slate-800" : "text-slate-400"}`}>{day.getDate()}</span>
                  {meta && <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${meta.dot}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 px-4 py-3 border-t border-slate-50">
          {Object.entries(STATUS).map(([, val]) => (
            <span key={val.label} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2 w-2 rounded-full ${val.dot}`} />{val.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
