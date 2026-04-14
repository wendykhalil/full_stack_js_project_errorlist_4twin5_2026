import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import {
  MessageCircle,
  User,
  ChevronRight,
  Loader2,
  AlertCircle,
  Inbox,
  Clock
} from 'lucide-react';
import SimpleFooter from '../components/Footer';

export default function Messages() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
          throw new Error('Error while loading messages');
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">{t('messages.loading', 'Chargement des messages...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t('common.retry', 'Réessayer')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('messages.title', 'Messages')}</h1>
            <p className="mt-1 text-slate-500">
              {t('messages.subtitle', 'Vos conversations avec les artisans et les fournisseurs')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Inbox className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            {t('messages.emptyTitle', 'Aucune conversation pour le moment')}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {t('messages.emptySubtitle', 'Les messages échangés apparaîtront ici')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <button
              key={conv.user._id}
              onClick={() => handleConversationClick(conv.user._id)}
              className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50">
                    {conv.user.profileImage ? (
                      <img 
                        src={conv.user.profileImage} 
                        alt="" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-7 w-7 text-indigo-500" />
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors" data-no-auto-translate translate="no">
                      {conv.user.firstName} {conv.user.lastName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(conv.lastMessage.createdAt)}</span>
                    </div>
                  </div>
                  
                  <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                    {conv.lastMessage.content}
                  </p>
                </div>
                
                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Extra margin bottom via spacing */}
      <div className="pb-8">
        <SimpleFooter />
      </div>
    </div>
  );
}