import React from "react";
import { Outlet } from "react-router-dom";
import { Bell, HardHat, LogOut } from "lucide-react";

export default function FournisseurLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
              <HardHat className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">BMP.tn</div>
              <div className="text-xs text-slate-500">Espace Fournisseur</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500" />
            </button>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">Fournisseur</div>
                <div className="text-xs text-slate-500">Compte</div>
              </div>
              <button className="rounded-xl p-2 text-slate-600 hover:bg-slate-100">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page */}
      <Outlet />
    </div>
  );
}
