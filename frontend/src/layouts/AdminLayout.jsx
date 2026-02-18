import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Bell, LayoutDashboard, Users, ArrowLeftRight, UserCircle2 } from "lucide-react";

const Tab = ({ to, icon, label }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `flex items-center gap-2 text-sm font-medium ${
        isActive ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
      }`
    }
  >
    {icon}
    {label}
  </NavLink>
);

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* TopNav */}
      <div className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">BMP.tn</div>
              <div className="text-xs text-slate-500">Administration</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="hidden items-center gap-6 md:flex">
            <Tab to="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Vue d'ensemble" />
            <Tab to="/admin/users" icon={<Users className="h-4 w-4" />} label="Utilisateurs" />
            <Tab to="/admin/transactions" icon={<ArrowLeftRight className="h-4 w-4" />} label="Transactions" />
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2 rounded-xl px-2 py-1 text-slate-700 hover:bg-slate-100">
              <span className="hidden text-sm md:inline">Administrateur</span>
              <UserCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* underline */}
        <div className="mx-auto hidden max-w-6xl gap-6 px-4 pb-2 md:flex">
          <div className="h-[2px] w-full bg-transparent" />
        </div>
      </div>

      {/* Page content */}
      <div className="px-4">
        <Outlet />
      </div>
    </div>
  );
}
