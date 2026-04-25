import React, { useState } from "react";
import { LogIn, Menu, UserPlus, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/bmp-logo.svg";

const NAV_ITEMS = [
  { to: "/login", label: "Se connecter", icon: LogIn },
  { to: "/register", label: "Créer un compte", icon: UserPlus },
];

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/40 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="group inline-flex items-center gap-3 text-left"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-blue-100/60 transition-transform group-hover:scale-[1.02]">
            <img src={logo} alt="BMP.tn logo" className="h-11 w-11" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">BMP.tn</div>
          </div>
        </button>

        <nav className="hidden items-center gap-2 md:flex ml-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to === "/register" && location.pathname.startsWith("/register"));
            const isPrimary = to === "/register";
            return (
              <Link
                key={to}
                to={to}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isPrimary
                    ? active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "bg-slate-950 text-white hover:bg-blue-700"
                    : active
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 md:hidden"
            aria-label="Basculer la navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg shadow-slate-200/40 md:hidden">
          <nav className="grid gap-2">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to || (to === "/register" && location.pathname.startsWith("/register"));
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`inline-flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] opacity-70">Ouvrir</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
