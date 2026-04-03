import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page = 1, pages = 1, onPageChange, className = "" }) {
  if (!pages || pages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  const visible = [];
  for (let i = start; i <= end; i += 1) visible.push(i);

  return (
    <div className={`mt-8 flex items-center justify-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>

      <div className="flex items-center gap-2">
        {visible.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${
              n === page ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(Math.min(pages, page + 1))}
        disabled={page >= pages}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
