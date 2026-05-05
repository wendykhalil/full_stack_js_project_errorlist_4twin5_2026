import React, { useState, useEffect } from "react";
import ReadCardButton from '../components/ReadCardButton';
import { useParams, useNavigate } from "react-router-dom";
import { ChevronDown, Upload, FileText, Plus, X, Image, File } from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from '../i18n';
import { useAuth } from "../auth/AuthContext";
import { getMyProducts, updateProduct } from "../auth/api.js";
import { useServerErrors } from "../hooks/useServerErrors";
import FieldError from "../components/FieldError";

// Champ avec gestion d'erreur
const Input = ({ label, placeholder, type = "text", value, onChange, error }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      className={`w-full rounded-xl border ${error ? 'border-red-400' : 'border-slate-200'} bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none`}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const Select = ({ label, placeholder, options = [], value, onChange, disabled }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <div className="relative">
      <select 
        value={value || ''} 
        onChange={onChange}
        disabled={disabled}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  </div>
);

const Textarea = ({ label, placeholder, value, onChange, error }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <textarea
      rows={4}
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      className={`w-full rounded-xl border ${error ? 'border-red-400' : 'border-slate-200'} bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none`}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const UploadBox = ({ title, subtitle, icon, files, onRemove, existingFiles = [], onChange }) => (
  <div>
    <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
    
    {/* Afficher les fichiers existants */}
    {existingFiles.length > 0 && (
      <div className="mb-3 space-y-2">
        <p className="text-xs font-medium text-slate-500">Fichiers actuels :</p>
        {existingFiles.map((file, index) => (
          <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              {title.includes('Image') ? 
                <Image className="h-4 w-4 text-indigo-500" /> : 
                <File className="h-4 w-4 text-indigo-500" />
              }
              <span className="text-xs text-slate-600 truncate max-w-[150px]">
                {file.split('/').pop()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    )}
    
    <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center hover:bg-slate-50">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-600">
        {files.length > 0 ? `${files.length} nouveau(x) fichier(s)` : subtitle}
      </div>
      <input type="file" multiple className="hidden" onChange={onChange} />
    </label>
  </div>
);

export default function FournisseurProduitEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: ''
  });
  
  // Ã‰tats pour les fichiers
  const [imageFiles, setImageFiles] = useState([]);
  const [docFiles, setDocFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [docsToDelete, setDocsToDelete] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { fieldErrors: serverErrors, globalError: serverGlobalError, handleError, clearErrors } = useServerErrors();
  
  // Ã‰tats pour les catégories
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_URL}/supplier/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.data) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([
          { _id: 'basicMaterials', name: 'Basic Materials' },
          { _id: 'flooring', name: 'Flooring' },
          { _id: 'paint', name: 'Paint' },
          { _id: 'carpentry', name: 'Carpentry' },
          { _id: 'electricity', name: 'Electricity' },
          { _id: 'plumbing', name: 'Plumbing' }
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (token) {
      fetchCategories();
    }
  }, [token]);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || !token) return;
      
      setLoading(true);
      setError('');
      
      try {
        console.log('Fetching product with ID:', id);
        const data = await getMyProducts({ token, search: '', page: 1, limit: 100 });
        
        // Gérer différentes structures de données
        let productsArray = [];
        if (data?.products) {
          productsArray = data.products;
        } else if (data?.data?.products) {
          productsArray = data.data.products;
        } else if (Array.isArray(data)) {
          productsArray = data;
        } else if (data?.data && Array.isArray(data.data)) {
          productsArray = data.data;
        }
        
        const product = productsArray.find(p => p._id === id);
        
        if (product) {
          setFormData({
            name: product.name || '',
            category: product.categoryId?._id || '',
            price: product.price?.toString() || '',
            stock: product.stock?.toString() || '',
            description: product.description || ''
          });
          
          // Sauvegarder les fichiers existants
          setExistingImages(product.imageUrls || []);
          setExistingDocs(product.documentation || []);
        } else {
          setError('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError(error.message || 'Error loading product');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, token]);

  // Category options
  const categoryOptions = [
    ...categories.map(cat => ({
      label: cat.name,
      value: cat._id
    })),
    ...customCategories.map((cat, index) => ({
      label: cat.name,
      value: `custom-${index}`
    }))
  ];

  const handleAddCustomCategory = () => {
    if (newCategoryName.trim()) {
      setCustomCategories([
        ...customCategories,
        { name: newCategoryName.trim(), _id: `custom-${Date.now()}` }
      ]);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    }
  };

  const handleRemoveExistingImage = (index) => {
    const imageToRemove = existingImages[index];
    setImagesToDelete([...imagesToDelete, imageToRemove]);
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleRemoveExistingDoc = (index) => {
    const docToRemove = existingDocs[index];
    setDocsToDelete([...docsToDelete, docToRemove]);
    setExistingDocs(existingDocs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    setSubmitting(true);
    try {
      const fd = new FormData();
      
      let categoryId = formData.category;
      
      const dataToSend = {
        name: formData.name,
        price: formData.price,
        stock: formData.stock,
        description: formData.description,
        // Envoyer les fichiers existants qui n'ont pas été supprimés
        existingImages: existingImages,
        existingDocs: existingDocs,
        // Envoyer la liste des fichiers à supprimer
        imagesToDelete: imagesToDelete,
        docsToDelete: docsToDelete
      };
      
      if (categoryId && categoryId.startsWith('custom-')) {
        const index = parseInt(categoryId.replace('custom-', ''));
        const customCat = customCategories[index];
        dataToSend.newCategory = customCat?.name || '';
      } else {
        dataToSend.category = categoryId;
      }
      
      fd.append('data', JSON.stringify(dataToSend));
      
      // Ajouter les nouveaux fichiers
      imageFiles.forEach(f => fd.append('newMedia', f));
      docFiles.forEach(f => fd.append('newMedia', f));

      await updateProduct({ token, id, formData: fd });
      console.log('Product updated successfully');
      navigate('/fournisseur/produits');
    } catch (error) {
      console.error('Error updating product:', error);
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingCategories) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">Chargement des données du produit...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {t('fournisseurProduitNew.title')} - Modifier
          </h1>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{t('fournisseurProduitNew.formTitle', 'Modifier le produit')}</h2>
          <ReadCardButton text={t('fournisseurProduitNew.formTitle', 'Modifier le produit')} />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <Input 
              label={t('fournisseurProduitNew.productNameLabel')} 
              placeholder={t('fournisseurProduitNew.productNamePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              error={serverErrors.name}
            />
            
            {/* Catégorie avec option d'ajout */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                {t('fournisseurProduitNew.categoryLabel')}
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      disabled={loadingCategories}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">{t('fournisseurProduitNew.categoryPlaceholder')}</option>
                      {categoryOptions.map((opt, idx) => (
                        <option key={idx} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(true)}
                    className="px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                {showNewCategoryInput && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nouvelle catégorie"
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 text-sm"
                    >
                      Ajouter
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                      }}
                      className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <Input 
              label={t('fournisseurProduitNew.priceLabel')} 
              placeholder="0.00" 
              type="text"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              error={serverErrors.price}
            />

            <Input 
              label={t('fournisseurProduitNew.stockLabel')} 
              placeholder="0" 
              type="text"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              error={serverErrors.stock}
            />
            <div />
          </div>

          <div className="mt-6">
            <Textarea 
              label={t('fournisseurProduitNew.descriptionLabel')} 
              placeholder={t('fournisseurProduitNew.descriptionPlaceholder')} 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              error={serverErrors.description}
            />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <UploadBox
              title={t('fournisseurProduitNew.imageUploadTitle')}
              subtitle={t('fournisseurProduitNew.imageUploadSubtitle')}
              icon={<Upload className="h-5 w-5" />}
              files={imageFiles}
              existingFiles={existingImages}
              onRemove={handleRemoveExistingImage}
              onChange={(e) => setImageFiles(Array.from(e.target.files))}
            />
            <UploadBox
              title={t('fournisseurProduitNew.pdfUploadTitle')}
              subtitle={t('fournisseurProduitNew.pdfUploadSubtitle')}
              icon={<FileText className="h-5 w-5" />}
              files={docFiles}
              existingFiles={existingDocs}
              onRemove={handleRemoveExistingDoc}
              onChange={(e) => setDocFiles(Array.from(e.target.files))}
            />
          </div>

          {serverGlobalError && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {serverGlobalError}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-4 md:flex-row">
            <button
              type="button"
              onClick={() => navigate("/fournisseur/produits")}
              className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {t('fournisseurProduitNew.cancelButton')}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-2xl bg-indigo-700 py-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : t('fournisseurProduitNew.submitButton')}
            </button>
          </div>
        </form>
      </section>
      <SimpleFooter />
    </div>
  );
}





