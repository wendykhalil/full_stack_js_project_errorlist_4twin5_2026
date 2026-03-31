import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, ShoppingCart, Star, Eye } from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from 'react-i18next';
import { getCatalogProducts, rateCatalogProduct, getMySubscription } from "../auth/api.js";
import { useAuth } from "../auth/AuthContext";
import SubscriptionAlert from '../components/SubscriptionAlert';

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
  onRate
}) => {
 
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const productRating = Number(product?.rating ?? product?.avgRating ?? 4.5);
  const normalizedRating = Number.isFinite(productRating) ? Math.max(0, Math.min(5, productRating)) : 4.5;
  const starCount = Math.round(normalizedRating);

  const [selectedRating, setSelectedRating] = useState(0);

  const renderProductStars = () => {
    return [0, 1, 2, 3, 4].map((index) => (
      <Star
        key={`product-star-${index}`}
        className={`h-4 w-4 ${index < starCount ? 'fill-orange-500 text-orange-500' : 'text-slate-300'}`}
      />
    ));
  };

  const renderRatingPicker = () => {
    return [1, 2, 3, 4, 5].map((value) => (
      <button
        key={`pick-${value}`}
        type="button"
        onClick={() => {
          setSelectedRating(value);
          onRate?.(product._id, value);
        }}
        className={`p-1 ${selectedRating >= value ? 'text-orange-500' : 'text-slate-300'}`}
      >
        <Star className="h-4 w-4" />
      </button>
    ));
  };
  
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative h-48 w-full">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-xl">
            <span className="text-slate-400">Loading...</span>
          </div>
        )}
        <img
          src={imgError ? 'https://via.placeholder.com/300x200?text=No+Image' : image}
          alt={title}
          className="h-48 w-full rounded-xl object-cover"
          onError={() => setImgError(true)}
          onLoad={() => setImgLoaded(true)}
          style={{ display: imgLoaded && !imgError ? 'block' : 'none' }}
        />
      </div>

      <div className="mt-4">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {category}
        </span>

        <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{description}</p>

        <div className="mt-2 text-sm text-slate-600">{supplier}</div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold text-indigo-700">
              {price} TND
            </div>
            <div className="text-xs text-slate-500">{unit}</div>
          </div>

          <div className="flex flex-col items-end gap-1 text-sm text-orange-500">
            <div className="flex items-center gap-1">
              {renderProductStars()}
              <span className="text-slate-800 ml-1">{normalizedRating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1" title="Cliquez pour noter">
              {renderRatingPicker()}
              <span className="text-xs text-slate-500">Noter</span>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onDetailsClick(product)}
            className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Détails
          </button>
          <button
            onClick={() => onOrderClick(product)}
            disabled={product.stock <= 0}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4" />
            Demander
          </button>
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
  const { token } = useAuth();
  const [subscription, setSubscription] = useState({ plan: 'FREE', status: 'INACTIVE' });
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);

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

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCatalogProducts({ search, category });
        
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
      } catch (error) {
        console.error('Error fetching catalog products:', error);
        setError(error.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, category]);

  const handleDetailsClick = (product) => {
    navigate(`/artisan/product/${product._id}`);
  };

  const handleOrderClick = (product) => {
    if (!isSubscribed) {
      setShowSubscriptionAlert(true);
      return;
    }
    navigate(`/artisan/order-request/${product._id}`);
  };

  const handleRateProduct = async (productId, rating) => {
    try {
      const data = await rateCatalogProduct({ productId, rating, token });
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, rating: data?.data?.rating ?? p.rating, ratingCount: data?.data?.ratingCount ?? p.ratingCount }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to rate product', err);
      alert(err.message || 'Erreur lors de l\'envoi de la note');
    }
  };

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

        <button 
          onClick={() => {
            if (!isSubscribed) {
              alert(t('subscription.required', 'Vous devez avoir un abonnement actif pour accéder à vos commandes.'));
              navigate('/artisan/subscription');
              return;
            }
            navigate('/artisan/orders');
          }}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          {t('artisanMarketplace.cartButton', { count: 0 })}
        </button>
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
        <div className="mt-8 text-center py-12">Loading products...</div>
      ) : error ? (
        <div className="mt-8 text-center py-12 text-red-600">
          Error loading products: {error}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8 text-center py-12 text-slate-500">
          No products found in the marketplace.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const imageUrl = product.imageUrls?.[0] 
              ? product.imageUrls[0]
              : 'https://via.placeholder.com/300x200?text=No+Image';
            
            return (
              <ProductCard
                key={product._id}
                product={product}
                image={imageUrl}
                category={product.categoryId?.name || 'Uncategorized'}
                title={product.name}
                description={product.description || 'No description'}
                supplier={product.supplierId?.companyName || 'Unknown Supplier'}
                price={product.price?.toFixed(2) || '0.00'}
                unit={product.unit || 'piece'}
                onDetailsClick={handleDetailsClick}
                onOrderClick={handleOrderClick}
                onRate={handleRateProduct}
              />
            );
          })}
        </div>
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