import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Upload, FileText, Plus, Package, ShoppingCart, TrendingUp } from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from 'react-i18next';

const StatCard = ({ title, value, icon, iconBg, iconFg }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
    </div>
  </div>
);

const Input = ({ label, placeholder, type = "text" }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
    />
  </div>
);

const Select = ({ label, placeholder, options = [] }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <div className="relative">
      <select className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none">
        <option value="">{placeholder}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  </div>
);

const Textarea = ({ label, placeholder }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <textarea
      rows={4}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
    />
  </div>
);

const UploadBox = ({ title, subtitle, icon }) => (
  <div>
    <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
    <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center hover:bg-slate-50">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-600">{subtitle}</div>
      <input type="file" className="hidden" />
    </label>
  </div>
);

export default function FournisseurProduitNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Options pour les selects (peuvent être externalisées si elles sont fixes)
  const categoryOptions = [
    t('fournisseurProduitNew.categories.basicMaterials'),
    t('fournisseurProduitNew.categories.flooring'),
    t('fournisseurProduitNew.categories.paint'),
    t('fournisseurProduitNew.categories.carpentry'),
    t('fournisseurProduitNew.categories.electricity'),
    t('fournisseurProduitNew.categories.plumbing')
  ];

  const unitOptions = [
    t('fournisseurProduitNew.units.piece'),
    t('fournisseurProduitNew.units.box'),
    t('fournisseurProduitNew.units.meter'),
    t('fournisseurProduitNew.units.squareMeter'),
    t('fournisseurProduitNew.units.liter'),
    t('fournisseurProduitNew.units.kilogram')
  ];

  return (
    <div className="flex-1">
      {/* Title + CTA */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {t('fournisseurProduitNew.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('fournisseurProduitNew.subtitle')}
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800">
          <Plus className="h-4 w-4" />
          {t('fournisseurProduitNew.addButton')}
        </button>
      </div>

      {/* Stats */}
      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={t('fournisseurProduitNew.stats.activeProducts')} 
          value="42" 
          icon={<Package />} 
          iconBg="bg-indigo-50" 
          iconFg="text-indigo-600" 
        />
        <StatCard 
          title={t('fournisseurProduitNew.stats.monthlyOrders')} 
          value="127" 
          icon={<ShoppingCart />} 
          iconBg="bg-emerald-50" 
          iconFg="text-emerald-600" 
        />
        <StatCard 
          title={t('fournisseurProduitNew.stats.revenue')} 
          value="45,280 TND" 
          icon={<TrendingUp />} 
          iconBg="bg-orange-50" 
          iconFg="text-orange-600" 
        />
        <StatCard 
          title={t('fournisseurProduitNew.stats.catalogs')} 
          value="3" 
          icon={<FileText />} 
          iconBg="bg-slate-100" 
          iconFg="text-slate-700" 
        />
      </section>

      {/* Form card */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('fournisseurProduitNew.formTitle')}</h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Input 
            label={t('fournisseurProduitNew.productNameLabel')} 
            placeholder={t('fournisseurProduitNew.productNamePlaceholder')} 
          />
          <Select 
            label={t('fournisseurProduitNew.categoryLabel')} 
            placeholder={t('fournisseurProduitNew.categoryPlaceholder')}
            options={categoryOptions}
          />

          <Input 
            label={t('fournisseurProduitNew.priceLabel')} 
            placeholder="0.00" 
            type="number" 
          />
          <Select 
            label={t('fournisseurProduitNew.unitLabel')} 
            placeholder={t('fournisseurProduitNew.unitPlaceholder')}
            options={unitOptions}
          />

          <Input 
            label={t('fournisseurProduitNew.stockLabel')} 
            placeholder="0" 
            type="number" 
          />
          <div />
        </div>

        <div className="mt-6">
          <Textarea 
            label={t('fournisseurProduitNew.descriptionLabel')} 
            placeholder={t('fournisseurProduitNew.descriptionPlaceholder')} 
          />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <UploadBox
            title={t('fournisseurProduitNew.imageUploadTitle')}
            subtitle={t('fournisseurProduitNew.imageUploadSubtitle')}
            icon={<Upload className="h-5 w-5" />}
          />
          <UploadBox
            title={t('fournisseurProduitNew.pdfUploadTitle')}
            subtitle={t('fournisseurProduitNew.pdfUploadSubtitle')}
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        {/* Bottom buttons */}
        <div className="mt-8 flex flex-col gap-4 md:flex-row">
          <button
            onClick={() => navigate("/fournisseur/produits")}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            {t('fournisseurProduitNew.cancelButton')}
          </button>

          <button
            onClick={() => navigate("/fournisseur/produits")}
            className="flex-1 rounded-2xl bg-indigo-700 py-4 text-sm font-semibold text-white hover:bg-indigo-800"
          >
            {t('fournisseurProduitNew.submitButton')}
          </button>
        </div>
      </section>
      <SimpleFooter />
    </div>
  );
}