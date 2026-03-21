import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { HardHat, Package, Shield, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import PublicNavbar from "../components/PublicNavbar";
import Footer from "../components/Footer";
import logo from "../assets/bmp-logo.svg";

const RoleCard = ({ icon, title, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/60"
  >
    <div className="flex items-center justify-between gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 transition group-hover:bg-blue-50 group-hover:text-blue-700">
        {icon}
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-700">
        Select
      </span>
    </div>

    <div className="mt-4 text-lg font-semibold text-slate-900">{title}</div>
    <div className="mt-1 text-sm leading-6 text-slate-500">{desc}</div>
  </button>
);

export default function RegisterChooseRole() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_25%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_25%)]" />

        <div className="relative z-10 w-full max-w-4xl">
          <div className="mx-auto max-w-xl text-center">
            <img src={logo} alt="BMP.tn logo" className="mx-auto h-12 w-12 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" />
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t("registerChooseRole.title")}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">{t("registerChooseRole.subtitle")}</p>
          </div>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70 sm:p-7 lg:p-8">
            <div className="mb-5 flex flex-col gap-2 text-center sm:mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Account setup</p>
              <p className="text-sm text-slate-500">Choose the role that best matches how you will use the platform.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RoleCard
                icon={<HardHat className="h-5 w-5" />}
                title={t("registerChooseRole.artisan.title")}
                desc={t("registerChooseRole.artisan.desc")}
                onClick={() => navigate("/register/artisan")}
              />
              <RoleCard
                icon={<User className="h-5 w-5" />}
                title={t("registerChooseRole.prescriber.title")}
                desc={t("registerChooseRole.prescriber.desc")}
                onClick={() => navigate("/register/prescripteur")}
              />
              <RoleCard
                icon={<Package className="h-5 w-5" />}
                title={t("registerChooseRole.supplier.title")}
                desc={t("registerChooseRole.supplier.desc")}
                onClick={() => navigate("/register/fournisseur")}
              />
              <RoleCard
                icon={<Shield className="h-5 w-5" />}
                title={t("registerChooseRole.admin.title")}
                desc={t("registerChooseRole.admin.desc")}
                onClick={() => navigate("/register/admin")}
              />
            </div>
          </div>

          <div className="mt-5 text-center text-sm text-slate-500">
            {t("registerChooseRole.alreadyAccount")} {" "}
            <Link to="/login" className="font-semibold text-slate-900 transition hover:text-blue-700 hover:underline">
              {t("registerChooseRole.loginLink")}
            </Link>
          </div>
        </div>
      </main>

      <Footer compact />
    </div>
  );
}
