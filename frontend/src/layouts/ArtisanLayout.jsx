  import React from "react";
  import { Outlet, NavLink } from "react-router-dom";
  import {
    Bell,
    HardHat,
    LayoutDashboard,
    FolderKanban,
    FileText,
    Receipt,
    ShoppingCart,
  } from "lucide-react";

  const NavItem = ({ to, icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-2 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "text-indigo-600 border-b-2 border-indigo-600"
            : "text-slate-600 hover:text-slate-900"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );

  export default function ArtisanLayout() {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Top header */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                <HardHat className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  BMP.tn
                </div>
                <div className="text-xs text-slate-500">
                  Construction Platform
                </div>
              </div>
            </div>

            <Bell className="h-5 w-5 text-slate-600" />
          </div>

          {/* Tabs */}
          <div className="mx-auto flex max-w-6xl gap-6 px-4 py-2">
            <NavItem
              to="/artisan"
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Tableau de bord"
            />
            <NavItem
              to="/artisan/projects"
              icon={<FolderKanban className="h-4 w-4" />}
              label="Projets"
            />
            <NavItem
              to="/artisan/devis/create"
              icon={<FileText className="h-4 w-4" />}
              label="Devis"
            />
            <NavItem
              to="/artisan/factures"
              icon={<Receipt className="h-4 w-4" />}
              label="Factures"
            />
            <NavItem
              to="/artisan/marketplace"
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Marketplace"
            />
          </div>
        </div>

        {/* Page content */}
        <div className="px-4">
          <Outlet />
        </div>
      </div>
    );
  }
