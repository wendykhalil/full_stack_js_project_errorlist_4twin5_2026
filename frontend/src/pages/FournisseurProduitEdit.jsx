import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronDown, Upload, FileText } from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../auth/AuthContext";
import { getMyProducts, updateProduct } from "../auth/api.js";

const Input = ({ label, placeholder, type = "text", value, onChange }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
    />
  </div>
);

const Select = ({ label, placeholder, options = [], value, onChange }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <div className="relative">
      <select 
        value={value} 
        onChange={onChange}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  </div>
);

const Textarea = ({ label, placeholder, value, onChange }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
    <textarea
      rows={4}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
    />
  </div>
);

const UploadBox = ({ title, subtitle, icon, onChange }) => (
  <div>
    <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
    <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center hover:bg-slate-50">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-600">{subtitle}</div>
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
    unit: '',
    stock: '',
    description: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [docFiles, setDocFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = [
    t('fournisseurProduitNew.categories.basicMaterials'),
    t('fournisseurProduitNew.categories.flooring'),
    t('fournisseurProduitNew.categories.paint'),
    t('fournisseurProduitNew.categories.carpentry'),
    t('fournisseurProduitNew.categories.electricity'),
    t('fournisseurProduitNew.categories.plumbing')
  ];

  const unitOptions = [
    t('fournisseurProduitNew.units.piece'),
    t('fournisseurProduitNew.units.box'),
    t('fournisseurProduitNew.units.meter'),
    t('fournisseurProduitNew.units.squareMeter'),
    t('fournisseurProduitNew.units.liter'),
    t('fournisseurProduitNew.units.kilogram')
  ];

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getMyProducts({ token, search: '', page: 1, limit: 100 });
        const product = data.products.find(p => p._id === id);
        if (product) {
          setFormData({
            name: product.name,
            category: product.categoryId?.name || '',
            price: product.price,
            unit: product.unit || '',
            stock: product.stock,
            description: product.description
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(formData));
      imageFiles.forEach(f => fd.append('media', f));
      docFiles.forEach(f => fd.append('media', f));

      await updateProduct({ token, id, formData: fd });
      navigate('/fournisseur/produits');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">Loading...</div>
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
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <Input 
              label={t('fournisseurProduitNew.productNameLabel')} 
              placeholder={t('fournisseurProduitNew.productNamePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <Select 
              label={t('fournisseurProduitNew.categoryLabel')} 
              placeholder={t('fournisseurProduitNew.categoryPlaceholder')}
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            />

            <Input 
              label={t('fournisseurProduitNew.priceLabel')} 
              placeholder="0.00" 
              type="number" 
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
            <Select 
              label={t('fournisseurProduitNew.unitLabel')} 
              placeholder={t('fournisseurProduitNew.unitPlaceholder')}
              options={unitOptions}
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />

            <Input 
              label={t('fournisseurProduitNew.stockLabel')} 
              placeholder="0" 
              type="number" 
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
            />
            <div />
          </div>

          <div className="mt-6">
            <Textarea 
              label={t('fournisseurProduitNew.descriptionLabel')} 
              placeholder={t('fournisseurProduitNew.descriptionPlaceholder')} 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <UploadBox
              title={t('fournisseurProduitNew.imageUploadTitle')}
              subtitle={t('fournisseurProduitNew.imageUploadSubtitle')}
              icon={<Upload className="h-5 w-5" />}
              onChange={(e) => setImageFiles(Array.from(e.target.files))}
            />
            <UploadBox
              title={t('fournisseurProduitNew.pdfUploadTitle')}
              subtitle={t('fournisseurProduitNew.pdfUploadSubtitle')}
              icon={<FileText className="h-5 w-5" />}
              onChange={(e) => setDocFiles(Array.from(e.target.files))}
            />
          </div>

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