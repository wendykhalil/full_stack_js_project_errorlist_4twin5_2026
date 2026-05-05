import React, { useState, useEffect } from 'react';
import ReadCardButton from '../components/ReadCardButton';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from '../i18n';
import { ChevronLeft, Package, MapPin, MessageSquare, Loader2 } from 'lucide-react';
import { getCatalogProducts, createOrder } from '../auth/api';
import SimpleFooter from '../components/Footer';
import { useFormValidation, rules } from '../hooks/useFormValidation';
import FieldError from '../components/FieldError';

export default function ArtisanOrderRequest() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { productId } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulaire
  const [formData, setFormData] = useState({
    quantity: 1,
    deliveryAddress: {
      street: '',
      city: '',
      postalCode: '',
      additionalInfo: ''
    },
    artisanMessage: ''
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getCatalogProducts({});
        let productsArray = [];
        if (data?.data?.products) {
          productsArray = data.data.products;
        } else if (data?.products) {
          productsArray = data.products;
        }
        
        const found = productsArray.find(p => p._id === productId);
        if (found) {
          setProduct(found);
        } else {
          setError(t('artisan.order.productNotFound', 'Produit non trouvé'));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      deliveryAddress: { ...prev.deliveryAddress, [name]: value }
    }));
  };

  const { errors: formErrors, validate } = useFormValidation({
    quantity: [rules.required('Quantité requise'), rules.numeric(), rules.min(1, 'Minimum 1')],
    street: [rules.required('Rue requise'), rules.minLength(3)],
    city: [rules.required('Ville requise'), rules.minLength(2)],
    postalCode: [rules.required('Code postal requis')],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const ok = validate({
      quantity: formData.quantity,
      street: formData.deliveryAddress.street,
      city: formData.deliveryAddress.city,
      postalCode: formData.deliveryAddress.postalCode,
    });
    if (!ok) return;
    setSubmitting(true);
    try {
      await createOrder({ token, orderData: {
        productId: product._id,
        quantity: formData.quantity,
        deliveryAddress: formData.deliveryAddress,
        artisanMessage: formData.artisanMessage,
      }});
      setSuccess('Votre demande de commande a été envoyée avec succès !');
      setTimeout(() => navigate('/artisan/orders'), 2000);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">{t('common.loading', 'Chargement...')}</div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Navigation */}
      <button
        onClick={() => navigate(`/artisan/product/${productId}`)}
        className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600"
      >
        <ChevronLeft className="h-5 w-5" />
        {t('common.back', 'Retour au produit')}
      </button>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold text-slate-900">
          {t('artisan.order.title', 'Demande de commande')}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t('artisan.order.subtitle', 'Remplissez ce formulaire pour demander ce produit au fournisseur')}
        </p>

        {/* Résumé du produit */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-4">
            {product.imageUrls?.[0] && (
              <img
                src={product.imageUrls[0]}
                alt={product.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
            )}
            <div>
              <h2 className="font-semibold text-slate-900">{product.name}</h2>
              <p className="text-sm text-slate-500">
                {t('artisan.order.supplier', 'Fournisseur')} : {product.supplierId?.companyName || t('common.notSpecified', 'Non spécifié')}
              </p>
              <p className="mt-1 text-lg font-semibold text-indigo-700">
                {product.price?.toFixed(2)} TND
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Quantité */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('artisan.order.quantity', 'Quantité')}
            </h3><ReadCardButton text="Section formulaire" /></div>
            <div className="mt-4">
              <input
                type="text"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none ${formErrors.quantity ? 'border-red-400' : 'border-slate-200 focus:border-indigo-500'}`}
              />
              <FieldError error={formErrors.quantity} />
              <p className="mt-1 text-xs text-slate-400">
                {t('artisan.order.stock', 'Stock disponible')} : {product.stock} {t('common.units', 'unités')}
              </p>
            </div>
          </div>

          {/* Adresse de livraison */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('artisan.order.deliveryAddress', 'Adresse de livraison')}
            </h3><ReadCardButton text="Section formulaire" /></div>
            <div className="mt-4 space-y-4">
              <input
                type="text"
                name="street"
                value={formData.deliveryAddress.street}
                onChange={handleAddressChange}
                placeholder={t('artisan.order.streetPlaceholder', 'Rue, numéro')}
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none ${formErrors.street ? 'border-red-400' : 'border-slate-200 focus:border-indigo-500'}`}
              />
              <FieldError error={formErrors.street} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="city"
                    value={formData.deliveryAddress.city}
                    onChange={handleAddressChange}
                    placeholder={t('artisan.order.cityPlaceholder', 'Ville')}
                    className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none ${formErrors.city ? 'border-red-400' : 'border-slate-200 focus:border-indigo-500'}`}
                  />
                  <FieldError error={formErrors.city} />
                </div>
                <div>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.deliveryAddress.postalCode}
                    onChange={handleAddressChange}
                    placeholder={t('artisan.order.postalCodePlaceholder', 'Code postal')}
                    className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none ${formErrors.postalCode ? 'border-red-400' : 'border-slate-200 focus:border-indigo-500'}`}
                  />
                  <FieldError error={formErrors.postalCode} />
                </div>
              </div>
              <textarea
                name="additionalInfo"
                value={formData.deliveryAddress.additionalInfo}
                onChange={handleAddressChange}
                placeholder={t('artisan.order.additionalInfoPlaceholder', "Informations complémentaires (étage, code d'accès...)")}
                rows="2"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Message */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('artisan.order.message', 'Message (optionnel)')}
            </h3><ReadCardButton text="Section formulaire" /></div>
            <div className="mt-4">
              <textarea
                name="artisanMessage"
                value={formData.artisanMessage}
                onChange={handleInputChange}
                placeholder={t('artisan.order.messagePlaceholder', "Ajoutez un message pour le fournisseur...")}
                rows="3"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Messages d'erreur/succès */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          )}

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.submitting', 'Envoi en cours...')}
              </>
            ) : (
              t('artisan.order.submit', 'Envoyer la demande')
            )}
          </button>
        </form>
      </div>
      <SimpleFooter />
    </div>
  );
}


