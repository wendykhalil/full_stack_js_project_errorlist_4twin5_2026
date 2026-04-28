import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Search, ChevronDown, ShoppingCart, Star, Eye } from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from '../i18n';
import { getCatalogProducts, getMySubscription, getFavorites, toggleFavorite } from "../auth/api.js";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../context/CartContext";
import SubscriptionAlert from '../components/SubscriptionAlert';
import { Hint } from "../components/MouseTooltip";
import ReadCardButton from '../components/ReadCardButton';

const ProductCard = ({
  product,
  image,
  category,
  title,
  description,
  supplier,
  price,
  unit,
  onDetailsClick,
  onOrderClick,
  isFavorited,
  onToggleFavorite,
  onAddToCart,
  addingToCart,
}) => {
  const [imgError,  setImgError]  = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasRating   = product.ratingCount > 0;
  const avgRating   = hasRating ? Number(product.rating) : 0;
  const filledStars = hasRating ? Math.round(avgRating) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-48 w-full">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-100">
            <span className="text-slate-400">Chargement...</span>
          </div>
        )}
        <img
          src={imgError ? 'https://via.placeholder.com/300x200?text=Pas+d%27image' : image}
          alt={title}
          className="h-48 w-full rounded-xl object-cover"
          onError={() => setImgError(true)}
          onLoad={() => setImgLoaded(true)}
          style={{ display: imgLoaded && !imgError ? 'block' : 'none' }}
        />
        {/* Favorite button */}
        <button
          type="button"
          onClick={() => onToggleFavorite(product._id)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition-transform hover:scale-110"
          aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
        </button>
      </div>

      <div className="mt-4">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {category}
        </span>

        <div className="flex items-center justify-between mt-3">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <ReadCardButton text={`${title} - ${category} - ${supplier} - ${price} TND/${unit} - ${description}`} />
        </div>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{description}</p>
        <div className="mt-2 text-sm text-slate-600">{supplier}</div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold text-indigo-700">{price} TND</div>
            <div className="text-xs text-slate-500">{unit}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= filledStars ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
              ))}
            </div>
            <span className="text-xs text-slate-500">
              {hasRating
                ? <>{avgRating.toFixed(1)} <span className="text-slate-400">({product.ratingCount})</span></>
                : <span className="text-slate-400">Pas d'avis</span>
              }
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          <Hint text="Voir la fiche complète du produit avec toutes ses caractéristiques et le fournisseur.">
          <button
            onClick={() => onDetailsClick(product)}
            className="flex items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Eye className="h-3.5 w-3.5" />
            Détails
          </button>
          </Hint>
          <Hint text="Ajouter ce produit à votre panier pour commander plusieurs articles en une fois.">
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock <= 0 || addingToCart}
            className="flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Panier
          </button>
          </Hint>
          <Hint text="Commander ce produit directement auprès du fournisseur.">
          <button
            onClick={() => onOrderClick(product)}
            disabled={product.stock <= 0}
            className="flex items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Commander
          </button>
          </Hint>
        </div>
      </div>
    </div>
  );
};

export default function ArtisanMarketplace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;
  const { token } = useAuth();
  const [subscription, setSubscription] = useState({ plan: 'FREE', status: 'INACTIVE' });
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState(new Set());
  const [addingToCart, setAddingToCart] = useState(null);
  const { addItem: addToCartCtx, itemCount } = useCart();

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
    const loadSubscription = async () => {
      if (!token) {
        setCheckingSubscription(false);
        return;
      }
      try {
        const res = await getMySubscription({ token });
        const subs = res?.data || { plan: 'FREE', status: 'INACTIVE' };
        setSubscription(subs);
      } catch (err) {
        console.error('Erreur récupération abonnement:', err);
        setSubscription({ plan: 'FREE', status: 'INACTIVE' });
      } finally {
        setCheckingSubscription(false);
      }
    };
    loadSubscription();
  }, [token]);

  const isSubscribed = subscription?.plan && subscription.plan !== 'FREE' && subscription.status === 'ACTIVE';

  // Load favorites
  useEffect(() => {
    if (!token) return;
    getFavorites({ token })
      .then(res => {
        const ids = new Set((res?.products || []).map(p => String(p._id)));
        setFavoritedIds(ids);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCatalogProducts({ search, category, page: currentPage, limit });
        
        // Handle different possible response structures
        let productsArray = [];
        if (data?.data?.products) {
          productsArray = data.data.products;
        } else if (data?.products) {
          productsArray = data.products;
        } else if (Array.isArray(data)) {
          productsArray = data;
        }
        
        setProducts(productsArray);

        const pagination = data?.data?.pagination || data?.pagination;
        const apiTotalPages = pagination?.totalPages ?? pagination?.pages ?? 1;
        setTotalPages(Math.max(1, Number(apiTotalPages) || 1));
      } catch (error) {
        console.error('Error fetching catalog products:', error);
        setError(error.message);
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

  const handleDetailsClick = (product) => {
    navigate(`/artisan/product/${product._id}`);
  };

  const handleOrderClick = (product) => {
    if (!isSubscribed) { setShowSubscriptionAlert(true); return; }
    navigate(`/artisan/order-request/${product._id}`);
  };

  const handleToggleFavorite = useCallback(async (productId) => {
    if (!token) return;
    const wasFav = favoritedIds.has(String(productId));
    // Optimistic
    setFavoritedIds(prev => {
      const n = new Set(prev);
      wasFav ? n.delete(String(productId)) : n.add(String(productId));
      return n;
    });
    try {
      await toggleFavorite({ token, productId });
    } catch {
      // Revert
      setFavoritedIds(prev => {
        const n = new Set(prev);
        wasFav ? n.add(String(productId)) : n.delete(String(productId));
        return n;
      });
    }
  }, [token, favoritedIds]);

  const handleAddToCart = useCallback(async (product) => {
    if (!isSubscribed) { setShowSubscriptionAlert(true); return; }
    setAddingToCart(product._id);
    try {
      await addToCartCtx(product._id, 1);
    } finally {
      setAddingToCart(null);
    }
  }, [isSubscribed, addToCartCtx]);

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {t('artisanMarketplace.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('artisanMarketplace.subtitle')}
          </p>
        </div>

        <Hint text="Voir votre panier et finaliser votre commande de matériaux.">
        <button 
          onClick={() => navigate('/artisan/cart')}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Panier {itemCount > 0 && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">{itemCount}</span>}
        </button>
        </Hint>
      </div>

      {/* Filters */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('artisanMarketplace.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="relative w-full md:w-60">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">{t('artisanMarketplace.filterAllCategories')}</option>
              <option value="basic-materials">{t('artisanMarketplace.categories.materials')}</option>
              <option value="paint">{t('artisanMarketplace.categories.paint')}</option>
              <option value="carpentry">{t('artisanMarketplace.categories.carpentry')}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 text-center py-12">Chargement des produits...</div>
      ) : error ? (
        <div className="mt-8 text-center py-12 text-red-600">
          Erreur lors du chargement des produits : {error}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8 text-center py-12 text-slate-500">
          Aucun produit trouve dans la marketplace.
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const imageUrl = product.imageUrls?.[0] 
                ? product.imageUrls[0]
                : 'https://via.placeholder.com/300x200?text=Pas+d%27image';
              
              return (
                <ProductCard
                  key={product._id}
                  product={product}
                  image={imageUrl}
                  category={product.categoryId?.name || 'Non categorie'}
                  title={product.name}
                  description={product.description || 'Aucune description'}
                  supplier={product.supplierId?.companyName || 'Fournisseur inconnu'}
                  price={product.price?.toFixed(2) || '0.00'}
                  unit={product.unit || 'piece'}
                  onDetailsClick={handleDetailsClick}
                  onOrderClick={handleOrderClick}
                  isFavorited={favoritedIds.has(String(product._id))}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCart={handleAddToCart}
                  addingToCart={addingToCart === product._id}
                />
              );
            })}
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
                  Précédent
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
      <SimpleFooter />

      <SubscriptionAlert
        isVisible={showSubscriptionAlert}
        onClose={() => setShowSubscriptionAlert(false)}
        title="Abonnement requis"
        message="Pour commander des produits et accéder à toutes les fonctionnalités, vous devez avoir un abonnement actif."
        actionText="Voir les abonnements"
        onAction={() => {
          setShowSubscriptionAlert(false);
          navigate('/artisan/subscription');
        }}
      />
    </div>
  );
}