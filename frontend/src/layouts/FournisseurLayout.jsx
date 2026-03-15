// ✅ FournisseurLayout.jsx (FULL FIXED CODE WITH LOGO - OPTIMIZED)

import React, { useState, useMemo } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  LogOut,
  Menu,
  X,
  Bell,
  UserCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";

const Tab = ({ to, icon, label, onClick, collapsed }) => (
  <NavLink
    to={to}
    end
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
        isActive
          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100"
      } ${collapsed ? "justify-center" : ""}`
    }
    title={collapsed ? label : undefined}
  >
    <span className="flex-shrink-0">{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

export default function FournisseurLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  // URL de base pour les images
  const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  // Utiliser useMemo pour calculer l'URL du logo uniquement quand user change
  const supplierLogo = useMemo(() => {
    if (!logoError && user?.supplierProfile?.logo) {
      const logoUrl = user.supplierProfile.logo.startsWith('http') 
        ? user.supplierProfile.logo 
        : `${SERVER_URL}${user.supplierProfile.logo}`;
      return logoUrl;
    }
    return null;
  }, [user, SERVER_URL, logoError]);

  const handleLogoError = () => {
    setLogoError(true);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden xl:flex xl:flex-col fixed left-0 top-0 h-full bg-white border-r border-slate-200 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700 ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div
          className={`flex items-center h-20 border-b border-slate-200 dark:border-slate-700 ${
            isSidebarCollapsed ? "justify-center" : "px-5"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
              <Package className="h-5 w-5" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  BMP.tn
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Fournisseur
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-1">
            <Tab
              to="/fournisseur/profile"
              icon={<UserCircle2 className="h-5 w-5" />}
              label="Profil"
              collapsed={isSidebarCollapsed}
            />
            <Tab
              to="/fournisseur/produits"
              icon={<Package className="h-5 w-5" />}
              label="Produits"
              collapsed={isSidebarCollapsed}
            />
            <Tab
              to="/fournisseur/produits/new"
              icon={<Plus className="h-5 w-5" />}
              label="Nouveau"
              collapsed={isSidebarCollapsed}
            />
          </div>
        </div>

        <div
          className={`border-t border-slate-200 dark:border-slate-700 p-3 ${
            isSidebarCollapsed ? "text-center" : ""
          }`}
        >
          <div
            className={`flex items-center gap-3 ${
              isSidebarCollapsed ? "justify-center" : ""
            } mb-3`}
          >
            {/* LOGO DU FOURNISSEUR - OPTIMISÉ AVEC useMemo */}
            {supplierLogo ? (
              <img 
                src={supplierLogo} 
                alt="Logo"
                className="h-10 w-10 rounded-full object-cover border-2 border-indigo-200"
                onError={handleLogoError}
              />
            ) : (
              <UserCircle2 className="h-10 w-10 text-slate-600 dark:text-slate-400" />
            )}
            
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                    "Fournisseur"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.supplierProfile?.companyName || "Fournisseur"}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
            title={isSidebarCollapsed ? "Déconnexion" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isSidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>

        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? "xl:ml-20" : "xl:ml-64"
        }`}
      >
        {/* Mobile Header */}
        <div className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/80 backdrop-blur xl:hidden dark:border-slate-700 dark:bg-slate-800/80">
          <div className="mx-auto flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              {/* LOGO DANS LE HEADER MOBILE */}
              {supplierLogo ? (
                <img 
                  src={supplierLogo} 
                  alt="Logo"
                  className="h-8 w-8 rounded-full object-cover border border-indigo-200"
                  onError={handleLogoError}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Package className="h-4 w-4" />
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  BMP.tn
                </div>
                <div className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                  {user?.supplierProfile?.companyName || "Fournisseur"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <button className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
                <Bell className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden xl:flex justify-end px-6 pt-4">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* Mobile Sidebar overlay */}
        <div
          className={`fixed inset-0 z-30 transform transition-transform duration-300 ease-in-out xl:hidden ${
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
                  {/* LOGO DANS LE MENU MOBILE */}
                  {supplierLogo ? (
                    <img 
                      src={supplierLogo} 
                      alt="Logo"
                      className="h-10 w-10 rounded-full object-cover border-2 border-indigo-200"
                      onError={handleLogoError}
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Package className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {[user?.firstName, user?.lastName].filter(Boolean).join(
                        " "
                      ) || "Fournisseur"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {user?.supplierProfile?.companyName || "Fournisseur"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-1 p-3">
                <Tab
                  to="/fournisseur/profile"
                  icon={<UserCircle2 className="h-5 w-5" />}
                  label="Profil"
                  onClick={closeMobileMenu}
                />
                <Tab
                  to="/fournisseur/produits"
                  icon={<Package className="h-5 w-5" />}
                  label="Produits"
                  onClick={closeMobileMenu}
                />
                <Tab
                  to="/fournisseur/produits/new"
                  icon={<Plus className="h-5 w-5" />}
                  label="Nouveau"
                  onClick={closeMobileMenu}
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 p-3">
                <button
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                    closeMobileMenu();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <LogOut className="h-5 w-5" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}