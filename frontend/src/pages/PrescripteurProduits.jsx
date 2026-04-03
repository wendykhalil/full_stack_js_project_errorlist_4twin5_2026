import React, { useState, useEffect } from "react";
import { Search, ChevronDown, FileText } from "lucide-react";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import { useTranslation } from "react-i18next";
import { getCatalogProducts } from "../auth/api.js";

const Card = ({ cat, title, desc, supplier, price, unit }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        {cat}
      </span>

      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <FileText className="h-4 w-4 text-slate-400" />
        {supplier}
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="text-xl font-semibold text-indigo-700">{Number.isFinite(Number(price)) ? Number(price).toFixed(2) : '0.00'} TND</div>
          <div className="text-xs text-slate-500">{unit}</div>
        </div>

        <button className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          {t('prescripteurProduits.detailsButton')}
        </button>
      </div>
    </div>
  );
};

export default function PrescripteurProduits() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 9;

  useEffect(() => {
    setPage(1);
    getCatalogProducts({ search, category }).then(data => {
      const nextProducts = Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
      setProducts(nextProducts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, category]);

  const pages = Math.max(1, Math.ceil(products.length / perPage));
  const paginatedProducts = products.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="flex-1">
      <h1 className="text-3xl font-semibold text-slate-900">
        {t('prescripteurProduits.title')}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {t('prescripteurProduits.subtitle')}
      </p>

      {/* Search / filter */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder={t('prescripteurProduits.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="relative w-full md:w-64">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">{t('prescripteurProduits.categoryPlaceholder')}</option>
              <option value="basicMaterials">{t('prescripteurProduits.categories.basicMaterials')}</option>
              <option value="flooring">{t('prescripteurProduits.categories.flooring')}</option>
              <option value="paint">{t('prescripteurProduits.categories.paint')}</option>
              <option value="carpentry">{t('prescripteurProduits.categories.carpentry')}</option>
              <option value="electricity">{t('prescripteurProduits.categories.electricity')}</option>
              <option value="plumbing">{t('prescripteurProduits.categories.plumbing')}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProducts.map((product) => (
              <Card
                key={product._id}
                cat={product.categoryId?.name || 'N/A'}
                title={product.name}
                desc={product.description}
                supplier={product.supplierId?.companyName || 'Supplier'}
                price={product?.price}
                unit="TND"
              />
            ))}
          </div>
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </>
      )}
      <Footer />
    </div>
  );
}

