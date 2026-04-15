import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import {
  ShoppingCart,
  Building2,
  ChevronLeft,
  Image as ImageIcon,
  Package,
  Tag,
  Layers,
  CheckCircle2,
  XCircle,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from 'lucide-react';
import { getCatalogProducts } from '../auth/api';
import { useAuth } from '../auth/AuthContext';
import { getMySubscription } from '../auth/api';
import TechnicalSheetViewer from '../components/TechnicalSheetViewer';
import SimpleFooter from '../components/Footer';
import SubscriptionAlert from '../components/SubscriptionAlert';

export default function ArtisanProductDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [subscription, setSubscription] = useState({ plan: 'FREE', status: 'INACTIVE' });
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!token) { setCheckingSubscription(false); return; }
      try {
        const res = await getMySubscription({ token });
        setSubscription(res?.data || { plan: 'FREE', status: 'INACTIVE' });
      } catch {
        setSubscription({ plan: 'FREE', status: 'INACTIVE' });
      } finally {
        setCheckingSubscription(false);
      }
    };
    loadSubscription();
  }, [token]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getCatalogProducts({});
        const arr = data?.data?.products || data?.products || [];
        const found = arr.find(p => p._id === id);
        found ? setProduct(found) : setError(t('product.notFound', 'Produit non trouvé'));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, t]);

  const isSubscribed =
    subscription?.plan && subscription.plan !== 'FREE' && subscription.status === 'ACTIVE';

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">Chargement du produit…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !product) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="text-slate-700 font-medium">{error || 'Produit non trouvé'}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            <ChevronLeft className="h-4 w-4" /> Retour
          </button>
        </div>
      </div>
    );
  }

  const supplier = product.supplierId || {};
  const images = product.imageUrls || [];
  const inStock = product.stock > 0;

  const supplierName =
    supplier.companyName ||
    (supplier.firstName || supplier.lastName
      ? `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim()
      : null) ||
    'Non disponible';

  const hasSheet = !!(product.technicalSheet || product.documentation?.length > 0);
  const sheet = product.technicalSheet || product.documentation?.[0];

  const prevImage = () => setSelectedImage(i => (i - 1 + images.length) % images.length);
  const nextImage = () => setSelectedImage(i => (i + 1) % images.length);

  return (
    <div className="flex-1 max-w-7xl mx-auto">

      {/* ── Breadcrumb / Back ── */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour au catalogue
        </button>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* ── Left: Image gallery (3 cols) ── */}
        <div className="lg:col-span-3 space-y-3">
          {/* Main image */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm"
               style={{ aspectRatio: '4/3' }}>
            {images.length > 0 ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-200"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                <ImageIcon className="h-16 w-16" />
                <span className="text-sm">Aucune image disponible</span>
              </div>
            )}

            {/* Prev / Next arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow flex items-center justify-center hover:bg-white transition-colors"
                >
                  <PrevIcon className="h-4 w-4 text-slate-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow flex items-center justify-center hover:bg-white transition-colors"
                >
                  <NextIcon className="h-4 w-4 text-slate-700" />
                </button>
                {/* Counter */}
                <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white font-medium">
                  {selectedImage + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? 'border-indigo-600 shadow-md scale-105'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Product info (2 cols) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">

            {/* Category + stock */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Tag className="h-3 w-3" />
                {product.categoryId?.name || 'Non catégorisé'}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                inStock
                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                  : 'bg-red-50 border border-red-100 text-red-600'
              }`}>
                {inStock
                  ? <><CheckCircle2 className="h-3 w-3" /> En stock</>
                  : <><XCircle className="h-3 w-3" /> Rupture de stock</>
                }
              </span>
            </div>

            {/* Name */}
            <h1 className="text-2xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-extrabold text-indigo-700">
                {product.price?.toFixed(2)}
              </span>
              <span className="text-lg font-semibold text-indigo-500">TND</span>
              <span className="text-sm text-slate-400">/ {product.unit || 'pièce'}</span>
            </div>

            {/* Divider */}
            <hr className="border-slate-100" />

            {/* Stock quantity */}
            {product.stock > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Layers className="h-4 w-4 text-slate-400" />
                <span><span className="font-semibold text-slate-800">{product.stock}</span> unités disponibles</span>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => {
                if (!isSubscribed) { setShowSubscriptionAlert(true); return; }
                navigate(`/artisan/order-request/${product._id}`);
              }}
              disabled={!inStock || checkingSubscription}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-5 w-5" />
              {!inStock ? 'Produit indisponible' : 'Demander ce produit'}
            </button>
          </div>

          {/* Description card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <Package className="h-4 w-4 text-indigo-400" />
              Description
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description || 'Aucune description disponible.'}
            </p>
          </div>

          {/* Supplier card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
              <Building2 className="h-4 w-4 text-indigo-400" />
              Fournisseur
            </h2>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{supplierName}</p>
                {supplier.supplierProfile?.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {supplier.supplierProfile.description}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Fiche technique — full width below ── */}
      {hasSheet && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TechnicalSheetViewer sheet={sheet} title={product.name} />
        </div>
      )}

      <div className="mt-10">
        <SimpleFooter />
      </div>

      <SubscriptionAlert
        isVisible={showSubscriptionAlert}
        onClose={() => setShowSubscriptionAlert(false)}
        title="Abonnement requis"
        message="Pour commander ce produit et accéder à toutes les fonctionnalités, vous devez avoir un abonnement actif."
        actionText="Voir les abonnements"
        onAction={() => {
          setShowSubscriptionAlert(false);
          navigate('/artisan/subscription');
        }}
      />
    </div>
  );
}
