import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { HardHat, Menu, Search, X } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Footer from "../components/Footer";

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#eef3fb] dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <HardHat className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">BMP.tn</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Construction digital platform</div>
            </div>
          </Link>

          <div className="hidden flex-1 xl:flex xl:justify-center">
            <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800">
              <Search className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">Explore products, artisans and suppliers</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <nav className="hidden items-center gap-3 md:flex">
              <Link to="/login" className="rounded-2xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">Se connecter</Link>
              <Link to="/register" className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">S'inscrire</Link>
            </nav>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800 md:hidden">
            <nav className="flex flex-col gap-3">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Se connecter</Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">S'inscrire</Link>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer compact />
    </div>
  );
}
