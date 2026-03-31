import React, { useState, useEffect, useCallback } from 'react'; // Ajout de useCallback
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMySubscription } from '../auth/api';

import {
  Package,
  Plus,
  Eye,
  Trash2,
  Edit,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import SimpleFooter from '../components/Footer';
import SubscriptionAlert from '../components/SubscriptionAlert';

export default function ArtisanPortfolio() {
  
  const navigate = useNavigate();
  const { token } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const isSubscribed = subscription?.plan && subscription.plan !== 'FREE' && subscription.status === 'ACTIVE';

  // Utilisation de useCallback pour mémoriser la fonction
  const fetchProjects = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/artisan/portfolio/my-projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.data) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  }, [token]); // token est une dépendance

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // fetchProjects est maintenant stable

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!token) return;
      setCheckingSubscription(true);
      try {
        const subRes = await getMySubscription({ token });
        setSubscription(subRes?.data || { plan: 'FREE', status: 'ACTIVE' });
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setSubscription({ plan: 'FREE', status: 'ACTIVE' });
      } finally {
        setCheckingSubscription(false);
      }
    };

    fetchSubscription();
  }, [token]);

  const handleDelete = async (projectId) => {
    if (!isSubscribed) {
      alert('Abonnement actif requis pour supprimer un projet. Contactez l\'administrateur.');
      return;
    }

    if (!window.confirm('Voulez-vous vraiment supprimer ce projet ?')) return;

    setDeleting(projectId);
    try {
      const response = await fetch(`http://localhost:5000/api/artisan/portfolio/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setProjects(projects.filter(p => p._id !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Erreur lors de la suppression du projet');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-TN', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    // ... reste du JSX inchangé ...
    <div className="flex-1">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Mes réalisations
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gérez vos projets et travaux réalisés
          </p>
        </div>

        <button
          onClick={() => {
            if (!isSubscribed) {
              setShowSubscriptionAlert(true);
              return;
            }
            navigate('/artisan/portfolio/add');
          }}
          disabled={checkingSubscription}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white ${isSubscribed ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}
        >
          <Plus className="h-4 w-4" />
          {isSubscribed ? 'Ajouter un projet' : 'Abonnement requis'}
        </button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={fetchProjects}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Aucun projet
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Vous n'avez pas encore ajouté de projet à votre portfolio.
          </p>
          <button
            onClick={() => isSubscribed ? navigate('/artisan/portfolio/add') : null}
            disabled={!isSubscribed}
            className={`mt-6 rounded-xl px-6 py-3 text-sm font-semibold text-white ${isSubscribed ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}
          >
            {isSubscribed ? 'Ajouter mon premier projet' : 'Abonnement requis'}
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project._id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Images */}
              <div className="relative h-48 bg-slate-100">
                {project.images && project.images.length > 0 ? (
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-slate-400" />
                  </div>
                )}
                
                {project.images && project.images.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    +{project.images.length - 1}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-2">
                  {project.title}
                </h3>
                
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {project.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(project.date)}</span>
                  <MapPin className="h-3 w-3 ml-2" />
                  <span>{project.location}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => navigate(`/artisan/portfolio/${project._id}`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Eye className="h-3 w-3" />
                    Voir
                  </button>
                  <button
                    onClick={() => navigate(`/artisan/portfolio/edit/${project._id}`)}
                    disabled={!isSubscribed}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg ${isSubscribed ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-400 bg-slate-100 cursor-not-allowed'}`}
                  >
                    <Edit className="h-3 w-3" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(project._id)}
                    disabled={!isSubscribed || deleting === project._id}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg ${isSubscribed ? 'text-red-600 hover:bg-red-50' : 'text-slate-400 bg-slate-100 cursor-not-allowed'}`}
                  >
                    {deleting === project._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SimpleFooter />

      <SubscriptionAlert
        isVisible={showSubscriptionAlert}
        onClose={() => setShowSubscriptionAlert(false)}
        title="Abonnement requis"
        message="Pour ajouter des projets à votre portfolio, vous devez avoir un abonnement actif."
        actionText="Voir les abonnements"
        onAction={() => {
          setShowSubscriptionAlert(false);
          navigate('/artisan/subscription');
        }}
      />
    </div>
  );
}