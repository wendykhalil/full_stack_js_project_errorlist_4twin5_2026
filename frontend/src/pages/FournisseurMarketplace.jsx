import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, Eye, Star } from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from '../i18n';
import { getCatalogProducts } from "../auth/api.js";

const ProductCard = ({
  product,
  image,
  category,
  title,
  description,
  supplier,
  price,
  unit,
  onDetailClick
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const productRating = Number(product?.rating ?? product?.avgRating ?? 4.5);
  const normalizedRating = Number.isFinite(productRating) ? Math.max(0, Math.min(5, productRating)) : 4.5;
  const starCount = Math.round(normalizedRating);

  const renderProductStars = () => {
    return [0, 1, 2, 3, 4].map((index) => (
      <Star
        key={`product-star-${index}`}
        className={`h-4 w-4 ${index < starCount ? 'fill-orange-500 text-orange-500' : 'text-slate-300'}`}
      />
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

        <div className="mt-2 text-xs text-slate-600">{supplier}</div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold text-indigo-700">{price} TND</div>
            <div className="text-xs text-slate-500">{unit}</div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {renderProductStars()}
            <span className="text-slate-800 ml-1">{normalizedRating.toFixed(1)}</span>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => onDetailClick(product)}
            className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <Eye className="h-4 w-4 inline-block mr-1" />
            Voir les détails
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FournisseurMarketplace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCatalogProducts({ search, category });
        let productsArray = [];
        if (data?.data?.products) {
          productsArray = data.data.products;
        } else if (data?.products) {
          productsArray = data.products;
        } else if (Array.isArray(data)) {
          productsArray = data;
        }
        setProducts(productsArray);
      } catch (err) {
        console.error('Error fetching catalog products:', err);
        setError(err.message || 'Erreur lors du chargement');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, category]);

  const handleDetailsClick = (product) => {
    navigate(`/fournisseur/product/${product._id}`);
  };

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{t('fournisseurMarketplace.title', 'Marché')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('fournisseurMarketplace.subtitle', 'Parcourez les produits disponibles')}</p>
        </div>
      </div>

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
        <div className="mt-8 text-center py-12">{t('common.loading', 'Chargement...')}</div>
      ) : error ? (
        <div className="mt-8 text-center py-12 text-red-600">{t('common.error', 'Erreur')} : {error}</div>
      ) : products.length === 0 ? (
        <div className="mt-8 text-center py-12 text-slate-500">{t('fournisseurMarketplace.noProducts', 'Aucun produit trouvé')}</div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const imageUrl = product.imageUrls?.[0] || 'https://via.placeholder.com/300x200?text=No+Image';
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
                onDetailClick={handleDetailsClick}
              />
            );
          })}
        </div>
      )}

      <SimpleFooter />
    </div>
  );
}
