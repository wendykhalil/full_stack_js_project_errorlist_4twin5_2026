import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { HardHat, User, Package, Shield } from "lucide-react";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "../components/LanguageSwitcher";

const RoleCard = ({ icon, title, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="flex items-start justify-between">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-indigo-700">
        {icon}
      </div>
    </div>

    <div className="mt-6 text-lg font-semibold text-slate-900">{title}</div>
    <div className="mt-2 text-sm text-slate-500">{desc}</div>
  </button>
);

export default function RegisterChooseRole() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      {/* Language Switcher - fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="min-h-screen bg-white">
        <main className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16">
          {/* Logo */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-700 text-white">
            <HardHat className="h-6 w-6" />
          </div>

          <h1 className="mt-6 text-3xl font-semibold text-slate-900">
            {t('registerChooseRole.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('registerChooseRole.subtitle')}
          </p>

          <div className="mt-10 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <RoleCard
              icon={<HardHat className="h-6 w-6" />}
              title={t('registerChooseRole.artisan.title')}
              desc={t('registerChooseRole.artisan.desc')}
              onClick={() => navigate("/register/artisan")}
            />
            <RoleCard
              icon={<User className="h-6 w-6" />}
              title={t('registerChooseRole.prescriber.title')}
              desc={t('registerChooseRole.prescriber.desc')}
              onClick={() => navigate("/register/prescripteur")}
            />
            <RoleCard
              icon={<Package className="h-6 w-6" />}
              title={t('registerChooseRole.supplier.title')}
              desc={t('registerChooseRole.supplier.desc')}
              onClick={() => navigate("/register/fournisseur")}
            />
            <RoleCard
              icon={<Shield className="h-6 w-6" />}
              title={t('registerChooseRole.admin.title')}
              desc={t('registerChooseRole.admin.desc')}
              onClick={() => navigate("/register/admin")}
            />
          </div>

          <div className="mt-10 text-sm text-slate-500">
            {t('registerChooseRole.alreadyAccount')}{" "}
            <Link to="/login" className="font-semibold text-indigo-700 hover:underline">
              {t('registerChooseRole.loginLink')}
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}