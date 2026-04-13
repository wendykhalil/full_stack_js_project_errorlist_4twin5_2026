import React, { useState } from "react";
import { Star } from "lucide-react";

// Display only
export function Stars({ rating = 0, total, size = "sm" }) {
  const dim = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${dim} ${i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
      ))}
      {rating > 0 && (
        <span className="ml-1 text-sm font-medium text-slate-700">
          {Number(rating).toFixed(1)}
          {total !== undefined && <span className="ml-1 font-normal text-slate-400">({total})</span>}
        </span>
      )}
    </span>
  );
}

// Interactive picker
export function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none">
          <Star className={`h-7 w-7 transition-colors ${i <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
        </button>
      ))}
    </span>
  );
}
