import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, 
  Building, 
  ChevronLeft,
  Image as ImageIcon
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
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Récupérer tous les produits et trouver celui avec l'ID
        const data = await getCatalogProducts({});
        let productsArray = [];
        if (data?.data?.products) {
          productsArray = data.data.products;
        } else if (data?.products) {
          productsArray = data.products;
        }
        
        const found = productsArray.find(p => p._id === id);
        if (found) {
          setProduct(found);
        } else {
          setError(t('product.notFound', 'Produit non trouvé'));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">{t('common.loading', 'Chargement...')}</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-600">
          {error || t('product.notFound', 'Produit non trouvé')}
        </div>
      </div>
    );
  }

  const supplier = product.supplierId || {};
  const images = product.imageUrls || [];

  return (
    <div className="flex-1">
      {/* Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600"
      >
        <ChevronLeft className="h-5 w-5" />
        {t('common.back', 'Retour au catalogue')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-20 w-20 text-slate-400" />
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx 
                        ? 'border-indigo-600' 
                        : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Détails */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
            
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                {product.categoryId?.name || t('common.uncategorized', 'Non catégorisé')}
              </span>
            </div>

            <div className="mt-6 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-bold text-indigo-700">
                  {product.price?.toFixed(2)} TND
                </span>
                <span className="ml-2 text-sm text-slate-500">
                  {product.unit || t('product.unit', 'pièce')}
                </span>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                product.stock > 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {product.stock > 0 
                  ? t('product.inStock', 'En stock') 
                  : t('product.outOfStock', 'Rupture')}
              </span>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700">
                {t('product.description', 'Description')}
              </h3>
              <p className="mt-2 text-slate-600">
                {product.description || t('product.noDescription', 'Aucune description disponible')}
              </p>
            </div>

            {/* Fournisseur */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building className="h-4 w-4" />
                {t('product.supplier', 'Fournisseur')}
              </h3>
              <p className="mt-2 font-medium text-slate-900">
                {supplier.companyName || supplier.supplierProfile?.companyName || t('common.notAvailable', 'Nom non disponible')}
              </p>
              {supplier.supplierProfile?.description && (
                <p className="mt-2 text-sm text-slate-600">
                  {supplier.supplierProfile.description}
                </p>
              )}
            </div>

            {/* Fiche technique */}
            {(product.technicalSheet || product.documentation?.length > 0) && (
              <div className="mt-4">
                <TechnicalSheetViewer 
                  sheet={product.technicalSheet || product.documentation?.[0]}
                  title={product.name}
                />
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  if (!isSubscribed) {
                    setShowSubscriptionAlert(true);
                    return;
                  }
                  navigate(`/artisan/order-request/${product._id}`);
                }}
                disabled={product.stock <= 0 || checkingSubscription}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5" />
                {t('product.request', 'Demander ce produit')}
              </button>
            </div>
          </div>
        </div>
      </div>
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