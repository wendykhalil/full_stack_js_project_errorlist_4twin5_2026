import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Upload, FileText, Package, ShoppingCart, TrendingUp, Plus, X } from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from '../i18n';
import { useAuth } from "../auth/AuthContext.jsx";
import { createProduct, getSupplierStats } from "../auth/api.js";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StatCard = ({ title, value, icon, iconBg, iconFg }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
    </div>
  </div>
);

// ✅ Input avec gestion d'erreur
const Input = ({ label, placeholder, type = "text", value, onChange, required, error }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full rounded-xl border ${error ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none`}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// ✅ Select avec gestion d'erreur
const Select = ({ label, placeholder, options = [], value, onChange, required, disabled, error }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <div className="relative">
      <select 
        value={value} 
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full appearance-none rounded-xl border ${error ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// ✅ Textarea avec gestion d'erreur
const Textarea = ({ label, placeholder, value, onChange, required, error }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <textarea
      rows={4}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full rounded-xl border ${error ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none`}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const UploadBox = ({ title, subtitle, icon, files, onChange }) => (
  <div>
    <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
    <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center hover:bg-slate-50">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-600">
        {files.length > 0 ? `${files.length} file(s) selected` : subtitle}
      </div>
      <input type="file" multiple className="hidden" onChange={onChange} />
    </label>
  </div>
);

export default function FournisseurProduitNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [docFiles, setDocFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/supplier/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.data) setCategories(data.data);
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
    if (token) fetchCategories();
  }, [token]);

  const categoryOptions = [
    ...categories.map(cat => ({ label: cat.name, value: cat._id })),
    ...customCategories.map((cat, index) => ({ label: cat.name, value: `custom-${index}` }))
  ];

  useEffect(() => {
    getSupplierStats({ token }).then(setStats).catch(console.error);
  }, [token]);

  const handleAddCustomCategory = () => {
    if (newCategoryName.trim()) {
      setCustomCategories([...customCategories, { name: newCategoryName.trim(), _id: `custom-${Date.now()}` }]);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError('');

    // Validation frontend rapide
    const frontendErrors = {};
    if (!formData.name.trim()) frontendErrors.name = 'Le nom est requis';
    if (!formData.price || parseFloat(formData.price) <= 0) frontendErrors.price = 'Prix invalide';
    if (!formData.stock || parseInt(formData.stock) < 0) frontendErrors.stock = 'Stock invalide';
    if (Object.keys(frontendErrors).length > 0) {
      setErrors(frontendErrors);
      setSubmitting(false);
      return;
    }

    try {
      const fd = new FormData();
      // Construire l'objet data à envoyer
      let categoryId = formData.category;
      const dataToSend = {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        description: formData.description
      };

      if (categoryId && categoryId.startsWith('custom-')) {
        const customCat = customCategories.find((_, idx) => `custom-${idx}` === categoryId);
        if (customCat) dataToSend.newCategory = customCat.name;
      } else if (categoryId) {
        dataToSend.categoryId = categoryId;
      } else {
        alert('Veuillez sélectionner une catégorie');
        setSubmitting(false);
        return;
      }

      fd.append('data', JSON.stringify(dataToSend));
      imageFiles.forEach(f => fd.append('media', f));
      docFiles.forEach(f => fd.append('media', f));

      const response = await fetch(`${API_URL}/supplier/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          if (data.errors && Array.isArray(data.errors)) {
            setGlobalError(data.errors.join(', '));
          } else if (data.error) {
            const errorMsg = data.error;
            if (errorMsg.includes('nom')) setErrors({ name: errorMsg });
            else if (errorMsg.includes('prix')) setErrors({ price: errorMsg });
            else if (errorMsg.includes('stock')) setErrors({ stock: errorMsg });
            else setGlobalError(errorMsg);
          } else if (data.message) {
            setGlobalError(data.message);
          } else {
            setGlobalError('Erreur de validation. Vérifiez les champs.');
          }
        } else {
          setGlobalError('Erreur serveur. Veuillez réessayer.');
        }
        return;
      }

      navigate('/fournisseur/produits');
    } catch (error) {
      console.error('Error creating product:', error);
      setGlobalError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {t('fournisseurProduitNew.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('fournisseurProduitNew.subtitle')}
          </p>
        </div>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('fournisseurProduitNew.stats.activeProducts')} value={stats.activeProducts || 0} icon={<Package />} iconBg="bg-indigo-50" iconFg="text-indigo-600" />
        <StatCard title={t('fournisseurProduitNew.stats.monthlyOrders')} value={stats.monthlyOrders || 0} icon={<ShoppingCart />} iconBg="bg-emerald-50" iconFg="text-emerald-600" />
        <StatCard title={t('fournisseurProduitNew.stats.revenue')} value={(stats.revenue || 0).toLocaleString() + ' TND'} icon={<TrendingUp />} iconBg="bg-orange-50" iconFg="text-orange-600" />
        <StatCard title={t('fournisseurProduitNew.stats.catalogs')} value={stats.catalogs || 0} icon={<FileText />} iconBg="bg-slate-100" iconFg="text-slate-700" />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('fournisseurProduitNew.formTitle')}</h2>

        <form onSubmit={handleSubmit}>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Input 
              label={t('fournisseurProduitNew.productNameLabel')}
              placeholder={t('fournisseurProduitNew.productNamePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              error={errors.name}
            />
            
            {/* Catégorie avec gestion d'erreur */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                {t('fournisseurProduitNew.categoryLabel')}
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select 
                      value={formData.category} 
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      disabled={loadingCategories}
                      className={`w-full appearance-none rounded-xl border ${errors.category ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50`}
                    >
                      <option value="">{loadingCategories ? 'Loading categories...' : t('fournisseurProduitNew.categoryPlaceholder')}</option>
                      {categoryOptions.map((opt, idx) => (
                        <option key={idx} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <button type="button" onClick={() => setShowNewCategoryInput(true)} className="px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}

                {showNewCategoryInput && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nouvelle catégorie" className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none" autoFocus />
                    <button type="button" onClick={handleAddCustomCategory} className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 text-sm">Ajouter</button>
                    <button type="button" onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(''); }} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"><X className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            </div>

            <Input 
              label={t('fournisseurProduitNew.priceLabel')}
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              error={errors.price}
            />
            
            <Input 
              label={t('fournisseurProduitNew.stockLabel')}
              placeholder="0"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
              error={errors.stock}
            />
            <div />
          </div>

          <div className="mt-6">
            <Textarea 
              label={t('fournisseurProduitNew.descriptionLabel')}
              placeholder={t('fournisseurProduitNew.descriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              error={errors.description}
            />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <UploadBox title={t('fournisseurProduitNew.imageUploadTitle')} subtitle={t('fournisseurProduitNew.imageUploadSubtitle')} icon={<Upload className="h-5 w-5" />} files={imageFiles} onChange={(e) => setImageFiles(Array.from(e.target.files))} />
            <UploadBox title={t('fournisseurProduitNew.pdfUploadTitle')} subtitle={t('fournisseurProduitNew.pdfUploadSubtitle')} icon={<FileText className="h-5 w-5" />} files={docFiles} onChange={(e) => setDocFiles(Array.from(e.target.files))} />
          </div>

          {globalError && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {globalError}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-4 md:flex-row">
            <button type="button" onClick={() => navigate("/fournisseur/produits")} className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              {t('fournisseurProduitNew.cancelButton')}
            </button>
            <button type="submit" disabled={submitting || loadingCategories} className="flex-1 rounded-2xl bg-indigo-700 py-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50">
              {submitting ? 'Creating...' : t('fournisseurProduitNew.submitButton')}
            </button>
          </div>
        </form>
      </section>
      <SimpleFooter />
    </div>
  );
}