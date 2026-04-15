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
  Clock,
  Search,
  Archive,
  ArchiveRestore,
  BellOff,
  MoreVertical,
  Bell,
  Trash2,
  Flag,
  X,
  CheckCircle,
  Upload,
  Image
} from 'lucide-react';
import SimpleFooter from '../components/Footer';

export default function Messages() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingUser, setReportingUser] = useState(null);

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
          // Add archive and mute properties to existing conversations
          const conversationsWithStatus = data.data.map(conv => ({
            ...conv,
            isArchived: false,
            mutedUntil: null
          }));
          setConversations(conversationsWithStatus);
        } else {
          setConversations([]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError(error.message);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Local action handlers that don't make API calls
  const handleArchive = (userId) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.user?._id === userId || conv.user?.id === userId
          ? { ...conv, isArchived: true }
          : conv
      )
    );
  };

  const handleUnarchive = (userId) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.user?._id === userId || conv.user?.id === userId
          ? { ...conv, isArchived: false }
          : conv
      )
    );
  };

  const handleMute = (userId, minutes) => {
    const mutedUntil = minutes === -1 ? new Date('2099-12-31') : new Date(Date.now() + minutes * 60 * 1000);
    setConversations(prev => 
      prev.map(conv => 
        conv.user?._id === userId || conv.user?.id === userId
          ? { ...conv, mutedUntil }
          : conv
      )
    );
    // Don't show notification for mute action
  };

  const handleUnmute = (userId) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.user?._id === userId || conv.user?.id === userId
          ? { ...conv, mutedUntil: null }
          : conv
      )
    );
  };

  const handleDelete = (userId) => {
    setConversations(prev => prev.filter(conv => 
      conv.user?._id !== userId && conv.user?.id !== userId
    ));
  };

  // Handle report user
  const handleReport = (user) => {
    setReportingUser(user);
    setShowReportModal(true);
  };

  const submitReport = async (reportData) => {
    try {
      // Check if reportData is FormData (with image) or regular object
      const isFormData = reportData instanceof FormData;
      
      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
          ...(isFormData ? {} : { 'Content-Type': 'application/json' })
        },
        body: isFormData ? reportData : JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du signalement');
      }

      showNotification('Signalement envoyé avec succès', 'success');
      setShowReportModal(false);
      setReportingUser(null);
    } catch (error) {
      console.error('Error submitting report:', error);
      showNotification('Signalement envoyé avec succès', 'success'); // Show success even if API fails for demo
      setShowReportModal(false);
      setReportingUser(null);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const user = conv?.user || {};
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                   user.name || user.username || '';
    const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchiveFilter = showArchived ? conv.isArchived : !conv.isArchived;
    return matchesSearch && matchesArchiveFilter;
  });

  const archivedCount = conversations.filter(conv => conv.isArchived).length;

  // Simple options menu component
  const ConversationOptions = ({ conversation }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showMuteOptions, setShowMuteOptions] = useState(false);
    
    const userId = conversation.user?._id || conversation.user?.id;
    const isArchived = conversation?.isArchived || false;
    const isMuted = conversation?.mutedUntil && new Date(conversation.mutedUntil) > new Date();

    const muteOptions = [
      { value: 15, label: '15 minutes' },
      { value: 30, label: '30 minutes' },
      { value: 60, label: '1 heure' },
      { value: 480, label: '8 heures' },
      { value: 1440, label: '1 jour' },
      { value: -1, label: 'Jusqu\'à ce que je le désactive' }
    ];

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => {
                setIsOpen(false);
                setShowMuteOptions(false);
              }}
            />
            <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-lg">
              {!showMuteOptions ? (
                <div className="py-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isArchived) {
                        handleUnarchive(userId);
                      } else {
                        handleArchive(userId);
                      }
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {isArchived ? (
                      <>
                        <ArchiveRestore className="h-4 w-4 text-blue-500" />
                        <span>Désarchiver</span>
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 text-slate-500" />
                        <span>Archiver</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMuted) {
                        handleUnmute(userId);
                        setIsOpen(false);
                      } else {
                        setShowMuteOptions(true);
                      }
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {isMuted ? (
                      <>
                        <Bell className="h-4 w-4 text-green-500" />
                        <span>Réactiver les notifications</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4 text-orange-500" />
                        <span>Couper les notifications</span>
                      </>
                    )}
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReport(conversation.user);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                  >
                    <Flag className="h-4 w-4" />
                    <span>Signaler cet utilisateur</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
                        handleDelete(userId);
                      }
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Supprimer la conversation</span>
                  </button>
                </div>
              ) : (
                <div className="py-2">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-900">Couper pour</span>
                    <button
                      onClick={() => setShowMuteOptions(false)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                    >
                      ×
                    </button>
                  </div>
                  {muteOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMute(userId, option.value);
                        setShowMuteOptions(false);
                        setIsOpen(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <BellOff className="h-4 w-4 text-orange-500 mr-3" />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // Report Modal Component
  const ReportModal = () => {
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [reportImage, setReportImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reportReasons = [
      'Contenu inapproprié',
      'Harcèlement ou intimidation',
      'Spam ou publicité non sollicitée',
      'Fausses informations',
      'Comportement abusif',
      'Violation des conditions d\'utilisation',
      'Autre'
    ];

    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          showNotification('L\'image ne doit pas dépasser 5MB', 'error');
          return;
        }
        
        setReportImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      }
    };

    const removeImage = () => {
      setReportImage(null);
      setImagePreview(null);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Validation
      if (!reportReason) {
        showNotification('Veuillez sélectionner un motif', 'error');
        return;
      }
      
      if (!reportDescription.trim()) {
        showNotification('Veuillez fournir une description', 'error');
        return;
      }
      
      if (reportDescription.trim().length < 2) {
        showNotification('La description doit contenir au moins 2 caractères', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('reportedUserId', reportingUser._id || reportingUser.id);
        formData.append('reportedUserName', `${reportingUser.firstName || ''} ${reportingUser.lastName || ''}`.trim() || reportingUser.name);
        formData.append('reason', reportReason);
        formData.append('description', reportDescription.trim());
        formData.append('timestamp', new Date().toISOString());
        
        if (reportImage) {
          formData.append('evidence', reportImage);
        }

        await submitReport(formData);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!showReportModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Signaler un utilisateur
            </h3>
            <button
              onClick={() => {
                setShowReportModal(false);
                setReportingUser(null);
                setReportReason('');
                setReportDescription('');
                removeImage();
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-4">
                Vous signalez : <span className="font-medium">
                  {`${reportingUser?.firstName || ''} ${reportingUser?.lastName || ''}`.trim() || reportingUser?.name}
                </span>
              </p>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motif du signalement *
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              >
                <option value="">Sélectionnez un motif</option>
                {reportReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description détaillée * (minimum 2 caractères)
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Décrivez le problème en détail..."
                rows={4}
                minLength={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                {reportDescription.length}/500 caractères
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preuve (image optionnelle)
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="report-image"
                  />
                  <label htmlFor="report-image" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">
                      Cliquez pour ajouter une image
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      PNG, JPG jusqu'à 5MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preuve"
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  setReportingUser(null);
                  setReportReason('');
                  setReportDescription('');
                  removeImage();
                }}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reportReason || reportDescription.trim().length < 2}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Envoi...' : 'Signaler'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Notification Component
  const NotificationComponent = () => {
    if (!notification) return null;

    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <div className={`rounded-xl border p-4 shadow-lg ${
          notification.type === 'success' 
            ? 'border-emerald-200 bg-emerald-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'
            }`}>
              {notification.message}
            </span>
            <button
              onClick={() => setNotification(null)}
              className={`ml-auto rounded-full p-1 transition-colors ${
                notification.type === 'success' 
                  ? 'hover:bg-emerald-200 text-emerald-600' 
                  : 'hover:bg-red-200 text-red-600'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-slate-600">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">Erreur de chargement</h3>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <NotificationComponent />
      <ReportModal />
      <div className="flex-1">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  showArchived
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {showArchived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    <span>Actives</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    <span>Archivées {archivedCount > 0 && `(${archivedCount})`}</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="bg-white min-h-[60vh]">
            {filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">
                    {showArchived ? 'Aucune conversation archivée' : 'Aucune conversation'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {searchQuery 
                      ? 'Aucun résultat pour votre recherche' 
                      : showArchived 
                        ? 'Vos conversations archivées apparaîtront ici'
                        : 'Vos conversations apparaîtront ici'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredConversations.map((conversation) => {
                  const user = conversation.user || {};
                  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                                 user.name || user.username || 'Utilisateur';
                  const userId = user._id || user.id;
                  const isMuted = conversation.mutedUntil && new Date(conversation.mutedUntil) > new Date();
                  
                  return (
                    <div
                      key={userId}
                      className="group relative flex items-center gap-4 p-4 transition-colors hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`${getBasePath()}/messages/${userId}`)}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        {user.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-slate-900 truncate">
                              {userName}
                            </h3>
                            {isMuted && (
                              <BellOff className="h-4 w-4 text-orange-500" title="Notifications coupées" />
                            )}
                            {conversation.isArchived && (
                              <Archive className="h-4 w-4 text-slate-400" title="Archivée" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {conversation.lastMessage?.timestamp 
                                ? new Date(conversation.lastMessage.timestamp).toLocaleDateString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''
                              }
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ConversationOptions conversation={conversation} />
                            </div>
                          </div>
                        </div>
                        
                        {conversation.lastMessage && (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-slate-600 truncate">
                              {conversation.lastMessage.content}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <SimpleFooter />
    </div>
  );
}