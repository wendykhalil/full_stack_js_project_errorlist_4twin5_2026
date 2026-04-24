import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Package, ShoppingCart, TrendingUp, FileText, Pencil, Trash2, Bot, Sparkles, Eye, Tag, AlertCircle, CheckCircle, Clock, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from '../i18n';
import { useAuth } from "../auth/AuthContext";
import { getMyProducts, getSupplierStats, deleteProduct, createProduct, smartSearchAI } from "../auth/api.js";
import AIProductAssistantModal from '../components/ai-assistant-product/AIProductAssistantModal';
import { Hint } from "../components/MouseTooltip";

const StatCard = ({ title, value, icon, iconBg, iconFg }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-indigo-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} shadow-sm`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
    </div>
  </div>
);

// Professional badge component
const Badge = ({ children, variant = "default" }) => {
  const variants = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    inStock: "bg-blue-50 text-blue-700 border-blue-200",
    lowStock: "bg-orange-50 text-orange-700 border-orange-200",
    outOfStock: "bg-slate-100 text-slate-600 border-slate-200",
    default: "bg-slate-100 text-slate-700 border-slate-200"
  };
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
};

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
  const [itemsPerPage] = useState(10);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProducts({ token, page, limit: itemsPerPage, search });
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
  }, [token, page, search, smartProductIds, itemsPerPage]);

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
    if (!window.confirm(t('confirmDelete') || 'Supprimer ce produit ?')) return;
    try {
      await deleteProduct({ token, id });
      fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/fournisseur/produits/edit/${id}`);
  };

  // Determine stock status for badge
  const getStockStatus = (stock) => {
    if (stock > 10) return "inStock";
    if (stock > 0) return "lowStock";
    return "outOfStock";
  };

  const getStockLabel = (stock) => {
    if (stock > 10) return `${stock} en stock`;
    if (stock > 0) return `${stock} restants`;
    return "Rupture";
  };

  // Pagination
  const totalPages = Math.ceil((stats?.totalProducts || products.length) / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('fournisseurProduits.title', 'Mes produits')}
          </h1>
          <p className="mt-2 text-slate-500">
            {t('fournisseurProduits.subtitle', 'Gérez votre catalogue de produits')}
          </p>
        </div>

        <div className="flex gap-3">
          <Hint text="Ajouter un nouveau produit à votre catalogue visible sur la place de marché.">
          <button
            onClick={() => navigate("/fournisseur/produits/new")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-700 hover:to-indigo-600 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            {t('fournisseurProduits.addButton', 'Ajouter un produit')}
          </button>
          </Hint>

          <Hint text="Utiliser l'IA pour créer ou optimiser automatiquement vos fiches produits.">
          <button
            onClick={() => setIsAIOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-md"
          >
            <Bot className="h-4 w-4" />
            Assistant IA
          </button>
          </Hint>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={t('fournisseurProduits.stats.activeProducts', 'Produits actifs')} 
          value={stats?.activeProducts || 0} 
          icon={<Package />} 
          iconBg="bg-indigo-50" 
          iconFg="text-indigo-600" 
        />
        <StatCard 
          title={t('fournisseurProduits.stats.monthlyOrders', 'Commandes du mois')} 
          value={stats?.activeOrders || 0} 
          icon={<ShoppingCart />} 
          iconBg="bg-emerald-50" 
          iconFg="text-emerald-600" 
        />
        <StatCard 
          title={t('fournisseurProduits.stats.revenue', 'Chiffre d\'affaires')} 
          value={(stats?.revenue || 0).toLocaleString() + ' TND'} 
          icon={<TrendingUp />} 
          iconBg="bg-orange-50" 
          iconFg="text-orange-600" 
        />
        <StatCard 
          title={t('fournisseurProduits.stats.catalogs', 'Catalogues')} 
          value={stats?.catalogs || 0} 
          icon={<FileText />} 
          iconBg="bg-slate-100" 
          iconFg="text-slate-700" 
        />
      </div>

      {/* Search Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('fournisseurProduits.searchPlaceholder', 'Rechercher un produit...')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-28 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button 
            type="button" 
            onClick={runSmartSearch} 
            className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-indigo-700"
          >
            <Sparkles className={`h-3.5 w-3.5 ${smartLoading ? 'animate-pulse' : ''}`} /> 
            Recherche IA
          </button>
        </div>
        {smartSuggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {smartSuggestions.map((suggestion) => (
              <button 
                key={suggestion} 
                type="button" 
                onClick={() => setSearch(suggestion)} 
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition-all hover:bg-indigo-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-slate-500">Chargement des produits...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-center gap-3 text-rose-700">
            <AlertCircle className="h-5 w-5" />
            <p>Erreur: {error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Aucun produit
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Commencez par ajouter votre premier produit
          </p>
          <button
            onClick={() => navigate("/fournisseur/produits/new")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter un produit
          </button>
        </div>
      )}

      {/* Modern Table */}
      {!loading && !error && products.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Produit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Catégorie</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Prix</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">Stock</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">Statut</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr 
                    key={product._id} 
                    className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    {/* Product Name with Image */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {product.imageUrls?.[0] ? (
                            <img 
                              src={product.imageUrls[0]} 
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 line-clamp-1">{product.name || "Sans nom"}</p>
                          {product.description && (
                            <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Category */}
                    <td className="px-6 py-4">
                      <Badge variant="default">
                        {product.categoryId?.name || "Non catégorisé"}
                      </Badge>
                    </td>
                    
                    {/* Price */}
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-indigo-600">
                        {product.price ? product.price.toFixed(2) : "0.00"} TND
                      </p>
                      <p className="text-xs text-slate-400">par unité</p>
                    </td>
                    
                    {/* Stock */}
                    <td className="px-6 py-4 text-center">
                      <Badge variant={getStockStatus(product.stock)}>
                        {getStockLabel(product.stock)}
                      </Badge>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <Badge variant={product.isApproved ? "approved" : "pending"}>
                        <div className="flex items-center gap-1">
                          {product.isApproved ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          <span>{product.isApproved ? "Approuvé" : "En attente"}</span>
                        </div>
                      </Badge>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Hint text="Modifier le nom, le prix, le stock ou les photos de ce produit.">
                        <button
                          onClick={() => handleEdit(product._id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        </Hint>
                        <Hint text="Supprimer définitivement ce produit de votre catalogue.">
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        </Hint>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <p className="text-sm text-slate-500">
                Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                <span className="font-medium">{Math.min(endIndex, products.length)}</span> sur{' '}
                <span className="font-medium">{products.length}</span> produits
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'border border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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