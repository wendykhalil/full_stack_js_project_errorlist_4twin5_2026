import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  MessageCircle,
  User,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import SimpleFooter from '../components/Footer';

export default function Messages() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour obtenir le chemin de base selon le rôle
  const getBasePath = () => {
    const path = window.location.pathname;
    if (path.includes('/artisan/')) return '/artisan';
    if (path.includes('/prescripteur/')) return '/prescripteur';
    if (path.includes('/fournisseur/')) return '/fournisseur';
    return '';
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/messages/recent', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement');
        }
        
        const data = await response.json();
        
        if (data.data) {
          setConversations(data.data);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchConversations();
    }
  }, [token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-TN', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const handleConversationClick = (userId) => {
    const basePath = getBasePath();
    navigate(`${basePath}/messages/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-slate-900 mb-2">
        Messages
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        Vos conversations avec les artisans et fournisseurs
      </p>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-2 text-slate-500">Aucune conversation</p>
          <p className="text-sm text-slate-400 mt-1">
            Les messages que vous échangez apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <button
              key={conv.user._id}
              onClick={() => handleConversationClick(conv.user._id)}
              className="w-full bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {conv.user.profileImage ? (
                  <img 
                    src={conv.user.profileImage} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-indigo-600" />
                )}
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">
                    {conv.user.firstName} {conv.user.lastName}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {formatDate(conv.lastMessage.createdAt)}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 line-clamp-1 mt-1">
                  {conv.lastMessage.content}
                </p>
              </div>

              {conv.unreadCount > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {conv.unreadCount}
                </div>
              )}
              
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      <SimpleFooter />
    </div>
  );
}