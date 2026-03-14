import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ShoppingCart, Star } from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from 'react-i18next';
import { getCatalogProducts } from "../auth/api.js";

const ProductCard = ({
  image,
  category,
  title,
  description,
  supplier,
  price,
  unit,
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <img
        src={image}
        alt={title}
        className="h-48 w-full rounded-xl object-cover"
      />

      <div className="mt-4">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {category}
        </span>

        <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>

        <div className="mt-2 text-sm text-slate-600">{supplier}</div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold text-indigo-700">
              {price} TND
            </div>
            <div className="text-xs text-slate-500">{unit}</div>
          </div>

          <div className="flex items-center gap-1 text-sm text-orange-500">
            <Star className="h-4 w-4 fill-orange-500" />
            4.5
          </div>
        </div>

        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <ShoppingCart className="h-4 w-4" />
          {t('artisanMarketplace.addToCart')}
        </button>
      </div>
    </div>
  );
};

export default function ArtisanMarketplace() {
  const { t } = useTranslation();
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
      console.log('=== FULL API RESPONSE ===');
      console.log('Raw data:', data);
      console.log('Data type:', typeof data);
      console.log('Is data an array?', Array.isArray(data));
      console.log('Data keys:', Object.keys(data || {}));
      
      // Check if data has a 'data' property
      if (data?.data) {
        console.log('data.data:', data.data);
        console.log('data.data keys:', Object.keys(data.data));
        if (data.data.products) {
          console.log('data.data.products:', data.data.products);
        }
      }
      
      // Check if data has 'products' directly
      if (data?.products) {
        console.log('data.products:', data.products);
      }
      
      // Handle different possible response structures
      let productsArray = [];
      if (data?.data?.products) {
        productsArray = data.data.products;
        console.log('Using data.data.products');
      } else if (data?.products) {
        productsArray = data.products;
        console.log('Using data.products');
      } else if (Array.isArray(data)) {
        productsArray = data;
        console.log('Using data as array');
      } else if (data?.data && Array.isArray(data.data)) {
        productsArray = data.data;
        console.log('Using data.data as array');
      } else if (data?.data?.data?.products) {
        productsArray = data.data.data.products;
        console.log('Using nested data.data.data.products');
      }
      
      console.log('Final products array:', productsArray);
      console.log('Products array length:', productsArray.length);
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

        <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
          🛒 {t('artisanMarketplace.cartButton', { count: 0 })}
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
          {products.map((product) => (
            <ProductCard
              key={product._id}
              image={product.imageUrls?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'}
              category={product.categoryId?.name || 'Uncategorized'}
              title={product.name}
              description={product.description || 'No description'}
              supplier={product.supplierId?.companyName || 'Unknown Supplier'}
              price={product.price?.toFixed(2) || '0.00'}
              unit={product.unit || 'piece'}
            />
          ))}
        </div>
      )}
      <SimpleFooter />
    </div>
  );
}