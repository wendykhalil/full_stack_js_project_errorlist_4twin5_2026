import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import {
  HardHat,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <div className="mx-auto flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
              <HardHat className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                BMP.tn
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Plateforme de construction
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 ml-4">
              <Link 
                to="/login" 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                S'inscrire
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 md:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 md:hidden">
            <nav className="flex flex-col gap-3">
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                S'inscrire
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto px-5 text-center text-sm text-slate-500 dark:text-slate-400">
          © 2024 BMP.tn - Tous droits réservés
        </div>
      </footer>
    </div>
  );
}