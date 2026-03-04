import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  HardHat, 
  User, 
  Package, 
  Shield, 
  Menu, 
  X,
  HelpCircle,
  Info,
  Mail,
  ChevronDown
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

const RoleCard = ({ icon, title, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
  >
    <div className="flex items-start justify-between">
      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-slate-50 text-indigo-700 dark:bg-slate-700">
        {icon}
      </div>
    </div>

    <div className="mt-4 sm:mt-6 text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
    <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">{desc}</div>
  </button>
);

const NavLink = ({ to, icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100"
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </Link>
);

export default function RegisterChooseRole() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                <HardHat className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  BMP.tn
                </div>
                <div className="hidden xs:block text-xs text-slate-500 dark:text-slate-400">
                  Plateforme de construction
                </div>
              </div>
            </Link>

            {/* Desktop Navigation - Right side */}
            <div className="hidden md:flex items-center gap-4">
              {/* Help Link */}
              <Link
                to="/help"
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Aide</span>
              </Link>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

              {/* Theme Toggle */}
              <ThemeToggle />

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

              {/* Login Button */}
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <User className="h-4 w-4" />
                <span>Se connecter</span>
              </Link>
            </div>

            {/* Mobile Right Side */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar - Slides from left to right */}
      <div
        className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={closeMobileMenu}
        />
        
        {/* Sidebar */}
        <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl dark:bg-slate-800">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <HardHat className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    BMP.tn
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Plateforme de construction
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-3">
                <NavLink
                  to="/help"
                  icon={<HelpCircle className="h-5 w-5" />}
                  label="Aide"
                  onClick={closeMobileMenu}
                />
              </div>
            </div>

            {/* Footer with Login Button */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <User className="h-4 w-4" />
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12 md:py-16">
        {/* Decorative logo */}
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 mx-auto">
          <HardHat className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <h1 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-semibold text-center text-slate-900 dark:text-white px-2">
          {t('registerChooseRole.title')}
        </h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-center text-slate-500 dark:text-slate-400 max-w-md px-4 mx-auto">
          {t('registerChooseRole.subtitle')}
        </p>

        {/* Role Cards Grid */}
        <div className="mt-8 sm:mt-10 grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 px-2 sm:px-0">
          <RoleCard
            icon={<HardHat className="h-5 w-5 sm:h-6 sm:w-6" />}
            title={t('registerChooseRole.artisan.title')}
            desc={t('registerChooseRole.artisan.desc')}
            onClick={() => navigate("/register/artisan")}
          />
          <RoleCard
            icon={<User className="h-5 w-5 sm:h-6 sm:w-6" />}
            title={t('registerChooseRole.prescriber.title')}
            desc={t('registerChooseRole.prescriber.desc')}
            onClick={() => navigate("/register/prescripteur")}
          />
          <RoleCard
            icon={<Package className="h-5 w-5 sm:h-6 sm:w-6" />}
            title={t('registerChooseRole.supplier.title')}
            desc={t('registerChooseRole.supplier.desc')}
            onClick={() => navigate("/register/fournisseur")}
          />
          <RoleCard
            icon={<Shield className="h-5 w-5 sm:h-6 sm:w-6" />}
            title={t('registerChooseRole.admin.title')}
            desc={t('registerChooseRole.admin.desc')}
            onClick={() => navigate("/register/admin")}
          />
        </div>

        {/* Login Link */}
        <div className="mt-8 sm:mt-10 text-xs sm:text-sm text-center text-slate-500 dark:text-slate-400">
          {t('registerChooseRole.alreadyAccount')}{" "}
          <Link to="/login" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-400">
            {t('registerChooseRole.loginLink')}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}