import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  MessageCircle,
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import SimpleFooter from '../components/Footer';

export default function ArtisanPublicProfile() {
  
  const navigate = useNavigate();
  const { token } = useAuth();
  const { id } = useParams();

  const [artisan, setArtisan] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
  const fetchArtisanProfile = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching artisan profile for ID:', id);
      
      const response = await fetch(`http://localhost:5000/api/artisan/profile/public/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      console.log('📥 Profile response:', data);

      if (data.data) {
        setArtisan(data.data);
      }

      // Récupérer le portfolio
      console.log('🔍 Fetching portfolio for artisan ID:', id);
      const portfolioResponse = await fetch(`http://localhost:5000/api/artisan/portfolio/public/${id}`);
      const portfolioData = await portfolioResponse.json();
      
      console.log('📥 Portfolio response:', portfolioData);
      
      if (portfolioData.data) {
        console.log('✅ Portfolio projects:', portfolioData.data.length);
        setPortfolio(portfolioData.data);
      } else {
        console.log('⚠️ No portfolio data');
      }

    } catch (err) {
      console.error('❌ Error fetching artisan profile:', err);
      setError('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  if (id) {
    fetchArtisanProfile();
  }
}, [id, token]);

 const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!message.trim()) return;

  setSending(true);
  try {
    const response = await fetch('http://localhost:5000/api/messages/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverId: artisan.userId, // ← Envoie l'ID de l'utilisateur
        content: message.trim()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'envoi');
    }

    alert('Message envoyé avec succès !');
    setShowContactForm(false);
    setMessage('');
    
  } catch (err) {
    console.error('Error sending message:', err);
    alert(err.message || 'Erreur lors de l\'envoi du message');
  } finally {
    setSending(false);
  }
};

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !artisan) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-red-600">{error || 'Artisan non trouvé'}</p>
          <button
            onClick={() => navigate('/prescripteur/search')}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto">
      {/* Navigation */}
      <button
        onClick={() => navigate('/prescripteur/search')}
        className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600"
      >
        <ChevronLeft className="h-5 w-5" />
        Retour à la recherche
      </button>

      {/* Profil header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Photo */}
            <div className="flex-shrink-0">
              {artisan.profileImage ? (
                <img
                  src={artisan.profileImage}
                  alt={artisan.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-16 w-16 text-indigo-600" />
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-slate-900">
                {artisan.name}
              </h1>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Briefcase className="h-5 w-5 text-indigo-500" />
                  <span className="font-medium">{artisan.trade}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-5 w-5 text-indigo-500" />
                  <span>{artisan.region}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-5 w-5 text-indigo-500" />
                  <a href={`tel:${artisan.phone}`} className="hover:text-indigo-600">
                    {artisan.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span>4.8 (12 avis)</span>
                </div>
              </div>

              {/* Description */}
              {artisan.description && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <p className="text-slate-700">{artisan.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <a
                  href={`tel:${artisan.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Appeler
                </a>
                <button
                  onClick={() => setShowContactForm(true)}
                  className="flex-1 flex items-center justify-center gap-2 border border-indigo-200 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Envoyer un message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">
          Réalisations
        </h2>

        {portfolio.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-2 text-slate-500">Aucun projet dans le portfolio</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((project) => (
              <div
                key={project._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
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

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(project.date).toLocaleDateString('fr-TN', {
                      year: 'numeric',
                      month: 'long'
                    })}</span>
                    <MapPin className="h-3 w-3 ml-2" />
                    <span>{project.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de contact */}
      {showContactForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Contacter {artisan.name}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Envoyez un message à l'artisan
              </p>

              <form onSubmit={handleSendMessage}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre message..."
                  rows="4"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <SimpleFooter />
    </div>
  );
}