import React, { useState, useEffect } from 'react';
import ReadCardButton from '../components/ReadCardButton';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import {
  Building,
  ChevronLeft,
  Image as ImageIcon,
  Phone,
  Mail,
  Package,
  Tag,
} from 'lucide-react';
import { getCatalogProducts } from '../auth/api';
import TechnicalSheetViewer from '../components/TechnicalSheetViewer';
import SimpleFooter from '../components/Footer';

export default function PrescripteurProductDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getCatalogProducts({});
        let productsArray = [];
        if (data?.data?.products) {
          productsArray = data.data.products;
        } else if (data?.products) {
          productsArray = data.products;
        }
        const found = productsArray.find((p) => p._id === id);
        if (found) {
          setProduct(found);
        } else {
          setError(t('product.notFound', 'Produit non trouvÃ©'));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-slate-500">{t('common.loading', 'Chargement...')}</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-red-600">{error || t('product.notFound', 'Produit non trouvÃ©')}</div>
      </div>
    );
  }

  const supplier = product.supplierId || {};
  const supplierName =
    supplier.companyName ||
    (supplier.firstName || supplier.lastName
      ? `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim()
      : null) ||
    t('common.notAvailable', 'Non disponible');

  const images = product.imageUrls || [];
  const hasSheet = !!(product.technicalSheet || product.documentation?.length > 0);
  const sheet = product.technicalSheet || product.documentation?.[0];

  return (
    <div className="flex-1">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
        {t('common.back', 'Retour au catalogue')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* â”€â”€ Images â”€â”€ */}
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
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-indigo-600' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ Details â”€â”€ */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Name + category */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
              <ReadCardButton text={`${product.name}. Catégorie: ${product.categoryId?.name}. Prix: ${product.price} TND. Stock: ${product.stock > 0 ? product.stock + ' unités' : 'Rupture'}. ${product.description || ''}`} size="md" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                <Tag className="h-3.5 w-3.5" />
                {product.categoryId?.name || t('common.uncategorized', 'Non catÃ©gorisÃ©')}
              </span>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {product.stock > 0
                  ? t('product.inStock', 'En stock')
                  : t('product.outOfStock', 'Rupture de stock')}
              </span>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-700">
                {product.price?.toFixed(2)} TND
              </span>
              <span className="text-sm text-slate-500">/ {product.unit || 'piÃ¨ce'}</span>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('product.description', 'Description')}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {product.description || t('product.noDescription', 'Aucune description disponible')}
              </p>
            </div>

            {/* Supplier */}
            <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <Building className="h-4 w-4 text-indigo-500" />
                {t('product.supplier', 'Fournisseur')}
              </h3>
              <p className="font-semibold text-slate-900 text-base">{supplierName}</p>
              {supplier.supplierProfile?.description && (
                <p className="mt-1 text-sm text-slate-500">{supplier.supplierProfile.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-4">
                {supplier.email && (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <Mail className="h-4 w-4" />
                    {supplier.email}
                  </a>
                )}
                {(supplier.phone || supplier.supplierProfile?.phone) && (
                  <a
                    href={`tel:${supplier.phone || supplier.supplierProfile?.phone}`}
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <Phone className="h-4 w-4" />
                    {supplier.phone || supplier.supplierProfile?.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* â”€â”€ Fiche technique inline â”€â”€ */}
          {hasSheet && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <TechnicalSheetViewer sheet={sheet} title={product.name} />
            </div>
          )}
        </div>
      </div>

      <SimpleFooter />
    </div>
  );
}

