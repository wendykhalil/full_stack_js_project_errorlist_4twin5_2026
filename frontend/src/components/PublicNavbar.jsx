import React from "react";
import { LogIn, Phone, UserPlus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import logo from "../assets/bmp-logo.svg";

const NAV_ITEMS = [
  { to: "/login", label: "Sign in", icon: LogIn },
  { to: "/login-phone", label: "Phone access", icon: Phone },
  { to: "/register", label: "Create account", icon: UserPlus },
];

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate("/")} className="group inline-flex items-center gap-3 text-left">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform group-hover:scale-[1.02]">
            <img src={logo} alt="BMP.tn logo" className="h-11 w-11" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">BMP.tn</div>
            <div className="text-xs text-slate-500">Digital platform for the construction sector</div>
          </div>
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
