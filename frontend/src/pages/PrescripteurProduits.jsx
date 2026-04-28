import React, { useState, useEffect } from "react";
import ReadCardButton from '../components/ReadCardButton';
import { Search, ChevronDown, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { useTranslation } from "../i18n";
import { getCatalogProducts } from "../auth/api.js";
import { Hint } from "../components/MouseTooltip";

const Card = ({ cat, title, desc, supplier, price, unit, onDetails }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        {cat}
      </span>

      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <ReadCardButton text={`${title}. Catégorie: ${cat}. Fournisseur: ${supplier}. Prix: ${price} TND. ${desc || ''}`} className="mt-1" />

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <FileText className="h-4 w-4 text-slate-400" />
        {supplier}
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="text-xl font-semibold text-indigo-700">{Number.isFinite(Number(price)) ? Number(price).toFixed(2) : '0.00'} TND</div>
          <div className="text-xs text-slate-500">{unit}</div>
        </div>

        <Hint text="Voir la fiche complÃ¨te du produit et contacter le fournisseur.">
        <button
          onClick={onDetails}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          {t('prescripteurProduits.detailsButton')}
        </button>
        </Hint>
      </div>
    </div>
  );
};

export default function PrescripteurProduits() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 9;

  const buildPaginationItems = (page, pages) => {
    const safePages = Math.max(1, Number(pages) || 1);
    const safePage = Math.min(Math.max(1, Number(page) || 1), safePages);
    if (safePages <= 7) return Array.from({ length: safePages }, (_, i) => i + 1);

    const items = [];
    const left = Math.max(2, safePage - 1);
    const right = Math.min(safePages - 1, safePage + 1);

    items.push(1);
    if (left > 2) items.push('...');
    for (let p = left; p <= right; p += 1) items.push(p);
    if (right < safePages - 1) items.push('...');
    items.push(safePages);

    return items;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCatalogProducts({ search, category, page: currentPage, limit });
        const nextProducts = Array.isArray(data?.data?.products)
          ? data.data.products
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data)
              ? data
              : [];
        setProducts(nextProducts);

        const pagination = data?.data?.pagination || data?.pagination;
        const apiTotalPages = pagination?.totalPages ?? pagination?.pages ?? 1;
        setTotalPages(Math.max(1, Number(apiTotalPages) || 1));
      } catch (e) {
        setError(e?.message || 'Erreur lors du chargement');
        setProducts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, category, currentPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

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
          <Hint text="Rechercher un produit par nom, description ou fournisseur.">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder={t('prescripteurProduits.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          </Hint>

          <Hint text="Filtrer les produits par catÃ©gorie de matÃ©riaux de construction.">
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
          </Hint>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 text-center py-12">{t('common.loading', 'Chargement...')}</div>
      ) : error ? (
        <div className="mt-8 text-center py-12 text-red-600">{t('common.error', 'Erreur')} : {error}</div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card
                key={product._id}
                cat={product.categoryId?.name || 'N/A'}
                title={product.name}
                desc={product.description}
                supplier={
                  product.supplierId?.companyName ||
                  (product.supplierId?.firstName
                    ? `${product.supplierId.firstName} ${product.supplierId.lastName || ''}`.trim()
                    : 'Fournisseur')
                }
                price={product?.price}
                unit="TND"
                onDetails={() => navigate(`/prescripteur/product/${product._id}`)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center">
              <nav className="inline-flex items-center gap-2" aria-label="Pagination">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  PrÃ©cÃ©dent
                </button>

                <div className="flex items-center gap-2">
                  {buildPaginationItems(currentPage, totalPages).map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-sm text-slate-400 select-none">
                          ...
                        </span>
                      );
                    }

                    const pageNumber = item;
                    const isActive = pageNumber === currentPage;
                    return (
                      <button
                        key={`page-${pageNumber}`}
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        disabled={loading}
                        className={[
                          "h-10 w-10 rounded-xl text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          loading ? "opacity-70 cursor-not-allowed" : ""
                        ].join(' ')}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </nav>
            </div>
          )}
        </>
      )}
      <Footer />
    </div>
  );
}


