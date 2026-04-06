import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMySubscription } from '../auth/api';

import {
  ChevronLeft,
  Upload,
  X,
  Calendar,
  MapPin,
  FileText,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import SimpleFooter from '../components/Footer';

export default function ArtisanPortfolioAdd() {

  const navigate = useNavigate();
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [subscription, setSubscription] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    tags: ''
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isSubscribed = subscription?.plan && subscription?.plan !== 'FREE' && subscription?.status === 'ACTIVE';

  // Vérifier si l'artisan a un profil
  useEffect(() => {
    const checkProfileAndSubscription = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/artisan/profile/my-profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setHasProfile(response.ok);
      } catch (err) {
        console.error('Error checking profile:', err);
        setHasProfile(false);
      } finally {
        setCheckingProfile(false);
      }

      try {
        const subRes = await getMySubscription({ token });
        setSubscription(subRes?.data || { plan: 'FREE', status: 'ACTIVE' });
      } catch (err) {
        console.error('Error checking subscription:', err);
        setSubscription({ plan: 'FREE', status: 'ACTIVE' });
      } finally {
        setCheckingSubscription(false);
      }
    };

    if (token) {
      checkProfileAndSubscription();
    }
  }, [token]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      setError('Certaines images dépassent la taille maximale de 5MB');
    }

    setImageFiles(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trial feature - let backend handle subscription check
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('tags', formData.tags);

      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      const response = await fetch('http://localhost:5000/api/artisan/portfolio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message === 'Profil artisan non trouvé') {
          setError('Vous devez d\'abord créer votre profil avant d\'ajouter des projets');
          setTimeout(() => {
            navigate('/artisan/profile/edit');
          }, 3000);
          return;
        }
        throw new Error(data.message || 'Erreur lors de l\'ajout du projet');
      }

      setSuccess('Projet ajouté avec succès !');
      
      setTimeout(() => {
        navigate('/artisan/portfolio');
      }, 2000);

    } catch (err) {
      console.error('Error adding project:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingProfile || checkingSubscription) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="flex-1 max-w-3xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-600" />
          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Profil incomplet
          </h2>
          <p className="mt-2 text-slate-600">
            Vous devez d'abord compléter votre profil avant de pouvoir ajouter des projets.
          </p>
          <button
            onClick={() => navigate('/artisan/profile/edit')}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Compléter mon profil
          </button>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  // Trial feature - allow all artisans to attempt, backend will handle limits
  
  return (
    <div className="flex-1 max-w-3xl mx-auto">
      {/* Navigation */}
      <button
        onClick={() => navigate('/artisan/portfolio')}
        className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600"
      >
        <ChevronLeft className="h-5 w-5" />
        Retour au portfolio
      </button>

      <h1 className="text-3xl font-semibold text-slate-900 mb-2">
        Ajouter un projet
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        Partagez vos réalisations avec les prescripteurs
      </p>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Photos du projet
          </h2>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium">
                Cliquez pour ajouter des photos
              </span>
              <p className="text-xs text-slate-400 mt-1">
                JPG, PNG, GIF. Max 5MB par image
              </p>
            </button>
          </div>
        </div>

        {/* Détails du projet */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Détails du projet
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Titre du projet *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                placeholder="Ex: Installation plomberie villa"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                rows="4"
                placeholder="Décrivez le projet réalisé..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lieu *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                    placeholder="Ex: Lac 2, Tunis"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date de réalisation *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tags (optionnel)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="Ex: plomberie, rénovation, salle de bain"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">
                Séparez les tags par des virgules
              </p>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/artisan/portfolio')}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-indigo-600 py-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Publier le projet
              </>
            )}
          </button>
        </div>
      </form>

      <SimpleFooter />
    </div>
  );
}