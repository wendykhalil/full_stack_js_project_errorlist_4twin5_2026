import React from "react";
import { HardHat, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo + Title */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-700 text-white">
            <HardHat className="h-6 w-6" />
          </div>

          <h1 className="mt-6 text-2xl font-semibold text-slate-900">
            Bienvenue sur BMP.tn
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Plateforme digitale pour le secteur du bâtiment
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                placeholder="votre@email.com"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" />
                Se souvenir de moi
              </label>

              <button className="text-indigo-600 hover:underline">
                Mot de passe oublié?
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={() => navigate("/artisan")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 py-3 font-semibold text-white hover:bg-indigo-800"
            >
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Register Link */}
            <p className="text-center text-sm text-slate-600">
              Pas encore de compte?{" "}
              <span
                className="font-medium text-indigo-600 hover:underline cursor-pointer"
                onClick={() => navigate("/register")}
              >
                S'inscrire
              </span>
            </p>
          </div>
        </div>

        {/* Quick Login */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-slate-500">Connexion rapide (démo)</p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/artisan")}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Artisan
            </button>
            <button
              onClick={() => navigate("/prescripteur")}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Prescripteur
            </button>
            <button
              onClick={() => navigate("/fournisseur")}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Fournisseur
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
