import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HardHat, User, Package, Menu, X, HelpCircle, UserCheck } from "lucide-react";

import { apiFetch } from "../auth/api";
import { Roles, roleToBasePath } from "../auth/role";
import { useAuth } from "../auth/AuthContext";

import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

const RoleCard = ({ icon, title, desc, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="group w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 disabled:hover:translate-y-0 dark:border-slate-700 dark:bg-slate-800"
  >
    <div className="flex items-start justify-between">
      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-slate-50 text-indigo-700 dark:bg-slate-700">
        {icon}
      </div>
    </div>

    <div className="mt-4 sm:mt-6 text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
      {title}
    </div>
    <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
      {desc}
    </div>
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

export default function RegisterRole() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, setSession, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    // Already has a real role => go to dashboard
    if (user?.role && user.role !== "REGISTER_ROLE") {
      navigate(roleToBasePath(user.role), { replace: true });
      return;
    }
    // Not logged in
    if (!token) {
      navigate("/login", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const from = location.state?.from;
  const subtitle =
    from === "google"
      ? "One-time setup after Google login"
      : from === "sms"
      ? "One-time setup after SMS login"
      : "Choose your role (one-time)";

  async function choose(role) {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/set-role", {
        method: "POST",
        token,
        body: { role },
      });
      setSession(res.token, res.user);
      navigate(roleToBasePath(res.user.role), { replace: true });
    } catch (e) {
      setError(e.message || "Failed to set role");
    } finally {
      setLoading(false);
    }
  }

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
                <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">BMP.tn</div>
                <div className="hidden xs:block text-xs text-slate-500 dark:text-slate-400">Plateforme de construction</div>
              </div>
            </Link>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/help"
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Aide</span>
              </Link>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <ThemeToggle />

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/40"
              >
                <User className="h-4 w-4" />
                <span>Se connecter</span>
              </Link>
            </div>

            {/* Mobile right */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={closeMobileMenu}
        />
        <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl dark:bg-slate-800">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <HardHat className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">BMP.tn</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Plateforme de construction</div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-3">
                <NavLink to="/help" icon={<HelpCircle className="h-5 w-5" />} label="Aide" onClick={closeMobileMenu} />
              </div>
            </div>

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
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 mx-auto">
          <UserCheck className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <h1 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-semibold text-center text-slate-900 dark:text-white px-2">
          Choose your role
        </h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-center text-slate-500 dark:text-slate-400 max-w-md px-4 mx-auto">
          {subtitle}. You will be asked only the first time.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        <div className="mt-8 sm:mt-10 grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 px-2 sm:px-0">
          <RoleCard
            icon={<HardHat className="h-5 w-5 sm:h-6 sm:w-6" />}
            title="Artisan"
            desc="Projects, quotes, invoices..."
            disabled={loading}
            onClick={() => choose(Roles.ARTISAN)}
          />
          <RoleCard
            icon={<User className="h-5 w-5 sm:h-6 sm:w-6" />}
            title="Prescripteur"
            desc="Browse products & artisans"
            disabled={loading}
            onClick={() => choose(Roles.PRESCRIPTEUR)}
          />
          <RoleCard
            icon={<Package className="h-5 w-5 sm:h-6 sm:w-6" />}
            title="Fournisseur"
            desc="Manage products & sales"
            disabled={loading}
            onClick={() => choose(Roles.SUPPLIER)}
          />
        </div>

        <div className="mt-8 sm:mt-10 text-xs sm:text-sm text-center text-slate-500 dark:text-slate-400">
          If you want to cancel, go back to{" "}
          <Link to="/login" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-400">
            login
          </Link>
          .
        </div>
      </main>

      <Footer />
    </div>
  );
}
