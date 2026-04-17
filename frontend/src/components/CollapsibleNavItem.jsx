import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";

// ── Sub-link ──────────────────────────────────────────────────────────────────
function SidebarLink({ item, collapsed, onClick }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
          isActive
            ? "bg-white/20 text-white shadow-sm"
            : "text-blue-100 hover:bg-white/10 hover:text-white"
        } ${collapsed ? "justify-center px-2" : ""}`
      }
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CollapsibleNavItem({
  title,
  icon,
  items = [],
  collapsed,
  onClick,
  defaultOpen = false,
  storageKey,
}) {
  // Initialise from localStorage if a key is provided, else use defaultOpen
  const [isExpanded, setIsExpanded] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) return stored === "true";
    }
    return defaultOpen;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, String(isExpanded));
  }, [isExpanded, storageKey]);

  // Animated height ref
  const bodyRef = useRef(null);

  const toggle = () => setIsExpanded(v => !v);

  // ── Collapsed sidebar: icon-only with hover flyout ────────────────────────
  if (collapsed) {
    return (
      <div className="relative group">
        <button
          onClick={toggle}
          title={title}
          className="flex w-full items-center justify-center rounded-xl px-2 py-2.5 text-[13px] font-medium text-blue-100 transition-all duration-200 hover:bg-white/10 hover:text-white"
        >
          <span className="flex-shrink-0">{icon}</span>
        </button>

        {/* Flyout on hover */}
        <div className="pointer-events-none absolute left-full top-0 z-50 ml-2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
          <div className="min-w-[200px] rounded-xl border border-blue-700/50 bg-gradient-to-b from-blue-800 via-blue-700 to-blue-800 shadow-xl">
            <div className="border-b border-blue-700/50 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">{title}</span>
            </div>
            <div className="space-y-1 p-2">
              {items.map(item => (
                <SidebarLink key={item.to} item={item} collapsed={false} onClick={onClick} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Expanded sidebar: full collapsible with animation ─────────────────────
  return (
    <div>
      {/* Header button */}
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-blue-100 transition-all duration-200 hover:bg-white/10 hover:text-white"
      >
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {/* Animated body */}
      <div
        ref={bodyRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? `${items.length * 52}px` : "0px",
          opacity:   isExpanded ? 1 : 0,
        }}
      >
        <div className="ml-4 mt-1 space-y-0.5 border-l border-blue-600/40 pl-3 pb-1">
          {items.map(item => (
            <SidebarLink key={item.to} item={item} collapsed={false} onClick={onClick} />
          ))}
        </div>
      </div>
    </div>
  );
}
