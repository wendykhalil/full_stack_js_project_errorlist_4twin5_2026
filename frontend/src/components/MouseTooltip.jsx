/**
 * MouseTooltip — a floating tooltip that follows the mouse cursor.
 *
 * Usage:
 *   <Hint text="Description ici">
 *     <YourComponent />
 *   </Hint>
 *
 * The tooltip appears near the cursor with a small delay and disappears on mouse-leave.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// ── Context ───────────────────────────────────────────────────────────────────
const TooltipCtx = createContext(null);

export function MouseTooltipProvider({ children }) {
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });
  const showTimer = useRef(null);

  const show = useCallback((text, x, y) => {
    clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => {
      setTooltip({ visible: true, text, x, y });
    }, 120); // small delay so it doesn't flash on quick passes
  }, []);

  const move = useCallback((x, y) => {
    setTooltip((prev) => (prev.visible ? { ...prev, x, y } : prev));
  }, []);

  const hide = useCallback(() => {
    clearTimeout(showTimer.current);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <TooltipCtx.Provider value={{ show, move, hide }}>
      {children}
      <TooltipOverlay tooltip={tooltip} />
    </TooltipCtx.Provider>
  );
}

// ── Floating overlay ──────────────────────────────────────────────────────────
function TooltipOverlay({ tooltip }) {
  const ref = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (ref.current) {
      setDims({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
    }
  }, [tooltip.text, tooltip.visible]);

  if (!tooltip.visible || !tooltip.text) return null;

  // Keep tooltip inside viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const offset = 14;
  let left = tooltip.x + offset;
  let top  = tooltip.y + offset;

  if (left + dims.w + 8 > vw) left = tooltip.x - dims.w - offset;
  if (top  + dims.h + 8 > vh) top  = tooltip.y - dims.h - offset;

  return (
    <div
      ref={ref}
      role="tooltip"
      style={{ left, top, position: "fixed", zIndex: 9999, pointerEvents: "none" }}
      className="max-w-[220px] rounded-xl bg-slate-900 px-3 py-2 shadow-2xl ring-1 ring-white/10"
    >
      <p className="text-[12px] leading-snug text-slate-100">{tooltip.text}</p>
    </div>
  );
}

// ── Hint wrapper ──────────────────────────────────────────────────────────────
export function Hint({ text, children, disabled = false }) {
  const ctx = useContext(TooltipCtx);

  const handleMouseEnter = useCallback(
    (e) => {
      if (!ctx || disabled || !text) return;
      ctx.show(text, e.clientX, e.clientY);
    },
    [ctx, text, disabled]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!ctx || disabled || !text) return;
      ctx.move(e.clientX, e.clientY);
    },
    [ctx, text, disabled]
  );

  const handleMouseLeave = useCallback(() => {
    if (!ctx) return;
    ctx.hide();
  }, [ctx]);

  // Clone child and attach mouse handlers without wrapping in an extra div
  return React.cloneElement(React.Children.only(children), {
    onMouseEnter: handleMouseEnter,
    onMouseMove:  handleMouseMove,
    onMouseLeave: handleMouseLeave,
  });
}
