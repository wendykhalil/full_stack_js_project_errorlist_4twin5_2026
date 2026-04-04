import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Package,
  ShoppingCart,
  TrendingUp,
  FileText,
  Pencil,
  Trash2,
  Bot,
  Sparkles,
} from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../auth/AuthContext";
import { getMyProducts, getSupplierStats, deleteProduct, createProduct, smartSearchAI } from "../auth/api.js";
import AIProductAssistantModal from '../components/ai-assistant-product/AIProductAssistantModal';

const StatCard = ({ title, value, icon, iconBg, iconFg }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </div>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
    </div>
  </div>
);

const Pill = ({ children, tone = "slate" }) => {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-100 text-indigo-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
};

const PriceCell = ({ price, unit }) => (
  <div className="text-right">
    <div className="font-medium text-slate-900">{price}</div>
    <div className="text-xs text-slate-500">{unit}</div>
  </div>
);

const ActionBtn = ({ children, className = "", onClick }) => (
  <button 
    onClick={onClick}
    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 ${className}`}
  >
    {children}
  </button>
);

export default function FournisseurProduits() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [smartProductIds, setSmartProductIds] = useState(null);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [smartLoading, setSmartLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProducts({ token, page, limit: 10, search });
      let productsArray = [];
      if (data?.products) productsArray = data.products;
      else if (data?.data?.products) productsArray = data.data.products;
      else if (Array.isArray(data)) productsArray = data;
      else if (data?.data && Array.isArray(data.data)) productsArray = data.data;
      if (smartProductIds?.length) {
        const rank = new Map(smartProductIds.map((id, index) => [String(id), index]));
        productsArray = productsArray
          .filter((item) => rank.has(String(item._id)))
          .sort((a, b) => rank.get(String(a._id)) - rank.get(String(b._id)));
      }
      setProducts(productsArray);
      
      if (page === 1) {
        try {
          const statsData = await getSupplierStats({ token });
          setStats(statsData?.data || {});
        } catch {
          setStats({});
        }
      }
    } catch (error) {
      setError(error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, smartProductIds]);

  useEffect(() => {
    if (token) fetchProducts();
  }, [fetchProducts, token]);


  const runSmartSearch = async () => {
    if (!search.trim()) {
      setSmartProductIds(null);
      setSmartSuggestions([]);
      fetchProducts();
      return;
    }
    try {
      setSmartLoading(true);
      const response = await smartSearchAI({ q: search, scope: 'products', limit: 20 });
      const ids = (response?.data?.products || []).map((item) => item._id);
      setSmartProductIds(ids);
      setSmartSuggestions(response?.data?.suggestions || []);
    } catch (error) {
      setError(error.message || 'Recherche IA indisponible');
    } finally {
      setSmartLoading(false);
    }
  };

  useEffect(() => {
    if (!search.trim()) {
      setSmartProductIds(null);
      setSmartSuggestions([]);
    }
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete') || 'Delete this product?')) return;
    try {
      await deleteProduct({ token, id });
      fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="flex-1">
      {/* Title + CTAs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {t('fournisseurProduits.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('fournisseurProduits.subtitle')}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/fournisseur/produits/new")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            {t('fournisseurProduits.addButton')}
          </button>

          <button
            onClick={() => setIsAIOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-purple-700 hover:to-indigo-700"
          >
            <Bot className="h-4 w-4" />
            Assistant IA
          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('fournisseurProduits.stats.activeProducts')} value={stats?.activeProducts || 0} icon={<Package />} iconBg="bg-indigo-50" iconFg="text-indigo-600" />
        <StatCard title={t('fournisseurProduits.stats.monthlyOrders')} value={stats?.activeOrders || 0} icon={<ShoppingCart />} iconBg="bg-emerald-50" iconFg="text-emerald-600" />
        <StatCard title={t('fournisseurProduits.stats.revenue')} value={(stats?.revenue || 0).toLocaleString() + ' TND'} icon={<TrendingUp />} iconBg="bg-orange-50" iconFg="text-orange-600" />
        <StatCard title={t('fournisseurProduits.stats.catalogs')} value={stats?.catalogs || 0} icon={<FileText />} iconBg="bg-slate-100" iconFg="text-slate-700" />
      </section>

      {/* Table card */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{t('fournisseurProduits.tableTitle')}</h2>
          <div className="w-full md:w-[26rem]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('fournisseurProduits.searchPlaceholder')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-28 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button type="button" onClick={runSmartSearch} className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                <Sparkles className={`h-3.5 w-3.5 ${smartLoading ? 'animate-pulse' : ''}`} /> IA
              </button>
            </div>
            {smartSuggestions.length ? <div className="mt-2 flex flex-wrap gap-2">{smartSuggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setSearch(suggestion)} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">{suggestion}</button>)}</div> : null}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-center py-10">Loading...</div>
        ) : error ? (
          <div className="mt-6 text-center py-10 text-red-600">Error loading products: {error}</div>
        ) : !products || products.length === 0 ? (
          <div className="mt-6 text-center py-10 text-slate-500">
            No products found. Click "Add Product" to create your first product.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-sm text-slate-500">
                  <th className="border-b border-slate-200 pb-3 font-semibold">{t('fournisseurProduits.table.product')}</th>
                  <th className="border-b border-slate-200 pb-3 font-semibold">{t('fournisseurProduits.table.category')}</th>
                  <th className="border-b border-slate-200 pb-3 text-right font-semibold">{t('fournisseurProduits.table.price')}</th>
                  <th className="border-b border-slate-200 pb-3 text-center font-semibold">{t('fournisseurProduits.table.stock')}</th>
                  <th className="border-b border-slate-200 pb-3 text-center font-semibold">{t('fournisseurProduits.table.status')}</th>
                  <th className="border-b border-slate-200 pb-3 text-right font-semibold">{t('fournisseurProduits.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
  {Array.isArray(products) && products.map((product) => (
    <tr key={product._id} className="text-sm">
      <td className="border-b border-slate-100 py-5">
        <div className="font-medium text-slate-900">{product.name || 'Unnamed'}</div>
        <div className="mt-1 text-xs text-slate-500">{product.description || ''}</div>
      </td>
      <td className="border-b border-slate-100 py-5">
        <Pill tone="slate">{product.categoryId?.name || 'N/A'}</Pill>
      </td>
      <td className="border-b border-slate-100 py-5">
        <PriceCell price={product.price ? product.price.toFixed(2) : '0.00'} unit="TND" />
      </td>
      <td className="border-b border-slate-100 py-5 text-center">
        <Pill tone={product.stock > 0 ? "green" : "red"}>{product.stock > 0 ? "En stock" : "Rupture"}</Pill>
      </td>
      <td className="border-b border-slate-100 py-5 text-center">
        <Pill tone="indigo">{product.isApproved ? "Approuvé" : "En attente"}</Pill>
      </td>
      <td className="border-b border-slate-100 py-5 text-right">
        <div className="inline-flex items-center gap-2">
          <ActionBtn onClick={() => navigate(`/fournisseur/produits/edit/${product._id}`)}>
            <Pencil className="h-4 w-4 text-slate-600" />
          </ActionBtn>
          <ActionBtn className="hover:bg-red-50" onClick={() => handleDelete(product._id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </ActionBtn>
        </div>
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        )}
      </section>

      <SimpleFooter />

      <AIProductAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onSubmit={async (productData) => {
          try {
            const fd = new FormData();
            const dataToSend = {
              name: productData.name,
              price: productData.price,
              stock: productData.stock,
              description: productData.description
            };
            if (productData.categoryId) dataToSend.categoryId = productData.categoryId;
            if (productData.newCategory) dataToSend.newCategory = productData.newCategory;
            fd.append('data', JSON.stringify(dataToSend));
            productData.images.forEach(img => fd.append('media', img));
            if (productData.documentation && productData.documentation.length > 0) {
  productData.documentation.forEach(doc => fd.append('media', doc));
}
            await createProduct({ token, formData: fd });
            setIsAIOpen(false);
            fetchProducts();
            return { success: true };
          } catch (error) {
            throw new Error(error.message || "Failed to create product");
          }
        }}
        token={token}
      />
    </div>
  );
}