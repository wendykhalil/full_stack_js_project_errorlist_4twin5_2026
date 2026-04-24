import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMySubscription } from '../auth/api';
import { Plus, Eye, Trash2, Edit, Calendar, MapPin, Image as ImageIcon, Loader2, AlertCircle, X, ChevronLeft, ChevronRight, Tag, Package } from 'lucide-react';
import SimpleFooter from '../components/Footer';
import SubscriptionAlert from '../components/SubscriptionAlert';
import { Hint } from '../components/MouseTooltip';

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
  const [viewingProject, setViewingProject] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
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
    // Trial feature - let backend handle subscription check
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
        const data = await response.json();
        if (data.message && data.message.includes('essai gratuit')) {
          setShowSubscriptionAlert(true);
        } else {
          throw new Error(data.message || 'Erreur lors de la suppression');
        }
        return;
      }

      setProjects(projects.filter(p => p._id !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err.message || 'Erreur lors de la suppression du projet');
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

        <Hint text="Ajouter une nouvelle réalisation à votre portfolio pour la montrer aux clients.">
        <button
          onClick={() => navigate('/artisan/portfolio/add')}
          disabled={checkingSubscription}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Ajouter un projet
        </button>
        </Hint>
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
            onClick={() => navigate('/artisan/portfolio/add')}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Ajouter mon premier projet
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
                  <Hint text="Voir les photos et détails complets de cette réalisation.">
                  <button
                    onClick={() => { setViewingProject(project); setImageIndex(0); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Eye className="h-3 w-3" />
                    Voir
                  </button>
                  </Hint>
                  <Hint text="Modifier le titre, la description, les photos ou les tags de cette réalisation.">
                  <button
                    onClick={() => navigate(`/artisan/portfolio/edit/${project._id}`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50"
                  >
                    <Edit className="h-3 w-3" />
                    Modifier
                  </button>
                  </Hint>
                  <Hint text="Supprimer définitivement cette réalisation de votre portfolio.">
                  <button
                    onClick={() => handleDelete(project._id)}
                    disabled={deleting === project._id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting === project._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Supprimer
                  </button>
                  </Hint>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SimpleFooter />

      {/* Project Detail Modal */}
      {viewingProject && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setViewingProject(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image gallery */}
            {viewingProject.images && viewingProject.images.length > 0 ? (
              <div className="relative h-64 bg-slate-100 rounded-t-2xl overflow-hidden">
                <img
                  src={viewingProject.images[imageIndex]}
                  alt={viewingProject.title}
                  className="w-full h-full object-cover"
                />
                {viewingProject.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImageIndex((imageIndex - 1 + viewingProject.images.length) % viewingProject.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setImageIndex((imageIndex + 1) % viewingProject.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {viewingProject.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImageIndex(i)}
                          className={`h-1.5 rounded-full transition-all ${i === imageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-40 bg-slate-100 rounded-t-2xl flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-slate-400" />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">{viewingProject.title}</h2>
                <button
                  onClick={() => setViewingProject(null)}
                  className="ml-4 p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-4 leading-relaxed">{viewingProject.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(viewingProject.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{viewingProject.location}</span>
                </div>
              </div>

              {viewingProject.tags && viewingProject.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {viewingProject.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { setViewingProject(null); navigate(`/artisan/portfolio/edit/${viewingProject._id}`); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  onClick={() => setViewingProject(null)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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