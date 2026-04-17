import React, { useState, useEffect, useCallback } from 'react';
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
  PlayCircle,
  VideoOff,
  Sparkles,
  Star,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import {
  getCatalogProductById,
  getProductRecommendations,
  getProductVideo,
  getMySubscription,
} from '../auth/api';
import { useAuth } from '../auth/AuthContext';
import TechnicalSheetViewer from '../components/TechnicalSheetViewer';
import SimpleFooter from '../components/Footer';
import SubscriptionAlert from '../components/SubscriptionAlert';

// ── YouTube embed ─────────────────────────────────────────────────────────────
function VideoSection({ productId }) {
  const [state, setState] = useState('loading'); // loading | found | none | error
  const [video, setVideo] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let active = true;
    setState('loading');
    setPlaying(false);

    getProductVideo({ id: productId })
      .then(res => {
        if (!active) return;
        const v = res?.data?.video;
        if (v) { setVideo(v); setState('found'); }
        else setState('none');
      })
      .catch(() => { if (active) setState('error'); });

    return () => { active = false; };
  }, [productId]);

  // Build the embed src depending on mode
  const embedSrc = video
    ? video.mode === 'embed'
      // Specific video — clean embed
      ? `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`
      // Search mode — YouTube search embed (no API key needed)
      : `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(video.searchQuery)}&rel=0&modestbranding=1`
    : null;

  // Thumbnail for specific-video mode
  const thumbnail = video?.mode === 'embed'
    ? (video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`)
    : null;

  const sourceLabel = video?.source === 'youtube' ? 'YouTube' : video?.source === 'search' ? 'Recherche YouTube' : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
        <PlayCircle className="h-5 w-5 text-indigo-500" />
        <h2 className="text-sm font-semibold text-slate-800">Vidéo produit</h2>
        {sourceLabel && (
          <span className="ml-auto rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
            {sourceLabel}
          </span>
        )}
      </div>

      <div className="p-6">
        {state === 'loading' && (
          <div className="flex items-center justify-center h-48 rounded-xl bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        )}

        {(state === 'none' || state === 'error') && (
          <div className="flex flex-col items-center justify-center h-48 rounded-xl bg-slate-50 gap-3 text-slate-400">
            <VideoOff className="h-10 w-10" />
            <p className="text-sm">Aucune vidéo disponible pour ce produit</p>
          </div>
        )}

        {state === 'found' && video && (
          <div className="space-y-3">
            {/* Specific video: show thumbnail first, then embed on click */}
            {video.mode === 'embed' && !playing ? (
              <button
                onClick={() => setPlaying(true)}
                className="relative w-full rounded-xl overflow-hidden bg-slate-900 group"
                style={{ aspectRatio: '16/9' }}
                aria-label="Lire la vidéo"
              >
                <img
                  src={thumbnail}
                  alt={video.title || 'Vidéo produit'}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <PlayCircle className="h-9 w-9 text-white fill-white" />
                  </div>
                </div>
              </button>
            ) : (
              /* Search mode OR after clicking play: show iframe directly */
              <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={embedSrc}
                  title={video.title || video.searchQuery || 'Vidéo produit'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            )}

            {/* Caption */}
            <p className="text-xs text-slate-400">
              {video.mode === 'search'
                ? `Résultats YouTube pour : "${video.searchQuery}"`
                : video.channelTitle
                  ? <><span className="font-medium text-slate-600">{video.channelTitle}</span> · {video.title}</>
                  : video.title
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recommendation card ───────────────────────────────────────────────────────
function RecommendationCard({ product, onOrder, isSubscribed }) {
  const [imgError, setImgError] = useState(false);
  const image = product.imageUrls?.[0];
  const inStock = product.stock > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col">
      <div className="relative h-36 bg-slate-100 flex-shrink-0">
        {image && !imgError ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-slate-300" />
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-semibold text-red-500">Rupture de stock</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5 w-fit">
          {product.categoryId?.name || 'Produit'}
        </span>
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mt-auto">
          {product.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-500">
              <Star className="h-3 w-3 fill-amber-400" />
              {product.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-base font-bold text-indigo-700">
            {product.price?.toFixed(2)} <span className="text-xs font-normal text-slate-400">TND</span>
          </span>
          <button
            onClick={() => onOrder(product)}
            disabled={!inStock}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Commander
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Recommendations section ───────────────────────────────────────────────────
function RecommendationsSection({ productId, onOrder, isSubscribed }) {
  const [state, setState] = useState('loading');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    let active = true;
    setState('loading');

    getProductRecommendations({ id: productId })
      .then(res => {
        if (!active) return;
        const recs = res?.data?.recommendations || [];
        setItems(recs);
        setState(recs.length > 0 ? 'found' : 'none');
      })
      .catch(() => { if (active) setState('error'); });

    return () => { active = false; };
  }, [productId]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddAll = () => {
    const selectedProducts = items.filter(p => selected.has(p._id) && p.stock > 0);
    selectedProducts.forEach(p => onOrder(p));
  };

  if (state === 'loading') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Chargement des recommandations…</span>
      </div>
    );
  }

  if (state === 'none' || state === 'error' || items.length === 0) return null;

  const selectedInStock = items.filter(p => selected.has(p._id) && p.stock > 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-800">Vous aurez aussi besoin de</h2>
          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
            {items.length} produits
          </span>
        </div>

        {selectedInStock.length > 0 && (
          <button
            onClick={handleAddAll}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Commander la sélection ({selectedInStock.length})
          </button>
        )}
      </div>

      {/* Select all hint */}
      <div className="px-6 pt-4 pb-1">
        <p className="text-xs text-slate-400">
          Sélectionnez les produits complémentaires dont vous avez besoin, puis commandez-les en une fois.
        </p>
      </div>

      {/* Grid */}
      <div className="p-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
        {items.map(product => (
          <div key={product._id} className="relative">
            {/* Selection checkbox */}
            <button
              onClick={() => toggleSelect(product._id)}
              className={`absolute top-2 left-2 z-10 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                selected.has(product._id)
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-white border-slate-300 hover:border-indigo-400'
              }`}
              aria-label="Sélectionner"
            >
              {selected.has(product._id) && (
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              )}
            </button>

            <div
              onClick={() => toggleSelect(product._id)}
              className={`cursor-pointer rounded-2xl transition-all ${
                selected.has(product._id) ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <RecommendationCard
                product={product}
                onOrder={onOrder}
                isSubscribed={isSubscribed}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
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
    if (!token) { setCheckingSubscription(false); return; }
    getMySubscription({ token })
      .then(res => setSubscription(res?.data || { plan: 'FREE', status: 'INACTIVE' }))
      .catch(() => setSubscription({ plan: 'FREE', status: 'INACTIVE' }))
      .finally(() => setCheckingSubscription(false));
  }, [token]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setSelectedImage(0);

    getCatalogProductById({ id })
      .then(res => {
        const p = res?.data;
        if (p) setProduct(p);
        else setError('Produit non trouvé');
      })
      .catch(err => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id]);

  const isSubscribed = subscription?.plan && subscription.plan !== 'FREE' && subscription.status === 'ACTIVE';

  const handleOrder = useCallback((p) => {
    if (!isSubscribed) { setShowSubscriptionAlert(true); return; }
    navigate(`/artisan/order-request/${p._id}`);
  }, [isSubscribed, navigate]);

  const prevImage = () => setSelectedImage(i => (i - 1 + (product?.imageUrls?.length || 1)) % (product?.imageUrls?.length || 1));
  const nextImage = () => setSelectedImage(i => (i + 1) % (product?.imageUrls?.length || 1));

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
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
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

  return (
    <div className="flex-1 max-w-7xl mx-auto space-y-8">

      {/* Breadcrumb */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour au catalogue
      </button>

      {/* ── Main grid: gallery + info ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* Gallery */}
        <div className="lg:col-span-3 space-y-3">
          <div
            className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm"
            style={{ aspectRatio: '4/3' }}
          >
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

            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow flex items-center justify-center hover:bg-white transition-colors">
                  <PrevIcon className="h-4 w-4 text-slate-700" />
                </button>
                <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow flex items-center justify-center hover:bg-white transition-colors">
                  <NextIcon className="h-4 w-4 text-slate-700" />
                </button>
                <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white font-medium">
                  {selectedImage + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === idx ? 'border-indigo-600 shadow-md scale-105' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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

            <h1 className="text-2xl font-bold text-slate-900 leading-snug">{product.name}</h1>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-extrabold text-indigo-700">{product.price?.toFixed(2)}</span>
              <span className="text-lg font-semibold text-indigo-500">TND</span>
              <span className="text-sm text-slate-400">/ {product.unit || 'pièce'}</span>
            </div>

            <hr className="border-slate-100" />

            {product.stock > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Layers className="h-4 w-4 text-slate-400" />
                <span><span className="font-semibold text-slate-800">{product.stock}</span> unités disponibles</span>
              </div>
            )}

            <button
              onClick={() => handleOrder(product)}
              disabled={!inStock || checkingSubscription}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-5 w-5" />
              {!inStock ? 'Produit indisponible' : 'Demander ce produit'}
            </button>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <Package className="h-4 w-4 text-indigo-400" />
              Description
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description || 'Aucune description disponible.'}
            </p>
          </div>

          {/* Supplier */}
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
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{supplier.supplierProfile.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Technical sheet ── */}
      {hasSheet && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TechnicalSheetViewer sheet={sheet} title={product.name} />
        </div>
      )}

      {/* ── Video section ── */}
      <VideoSection productId={id} />

      {/* ── Recommendations ── */}
      <RecommendationsSection
        productId={id}
        onOrder={handleOrder}
        isSubscribed={isSubscribed}
      />

      <SimpleFooter />

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
