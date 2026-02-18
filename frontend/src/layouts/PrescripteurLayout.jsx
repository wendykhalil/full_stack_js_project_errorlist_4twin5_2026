import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Bell, HardHat, Package, Users } from "lucide-react";

const Tab = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2 px-2 py-3 text-sm font-medium ${
        isActive
          ? "text-indigo-600 border-b-2 border-indigo-600"
          : "text-slate-600 hover:text-slate-900"
      }`
    }
  >
    {React.cloneElement(icon, { className: "h-4 w-4" })}
    {label}
  </NavLink>
);

export default function PrescripteurLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        {/* Top header */}
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">BMP.tn</div>
              <div className="text-xs text-slate-500">Espace Prescripteur</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500" />
            </button>

            <div className="flex items-center gap-2">
              <div className="hidden text-right md:block">
                <div className="text-sm font-semibold leading-none text-slate-900">
                  John Doe
                </div>
                <div className="mt-1 text-xs text-slate-500">Prescripteur</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto flex max-w-6xl gap-6 px-4">
          <Tab to="/prescripteur" icon={<Package />} label="Produits" />
          <Tab to="/prescripteur/artisans" icon={<Users />} label="Artisans" />
        </div>
      </div>

      <div className="px-4">
        <Outlet />
      </div>
    </div>
  );
}
