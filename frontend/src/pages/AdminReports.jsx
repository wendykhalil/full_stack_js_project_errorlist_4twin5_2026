import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  Flag,
  AlertTriangle,
  Ban,
  MessageSquare,
  Clock,
  CheckCircle,
  X,
  Eye,
  UserX,
  AlertCircle,
  Filter,
  Search,
  Calendar
} from 'lucide-react';

export default function AdminReports() {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/reports/admin/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error while loading reports');
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.data && data.data.length > 0) {
        console.log('Real reports data:', data.data);
        // Ensure the data structure is correct
        const processedReports = data.data.map(report => ({
          ...report,
          id: report._id || report.id,
          reportedUser: {
            id: report.reportedUser?.id || report.reportedUser?._id,
            firstName: report.reportedUser?.firstName || 'Utilisateur',
            lastName: report.reportedUser?.lastName || 'Inconnu',
            email: report.reportedUser?.email || 'email@inconnu.com'
          },
          reportedBy: {
            id: report.reportedBy?.id || report.reportedBy?._id,
            firstName: report.reportedBy?.firstName || 'Utilisateur',
            lastName: report.reportedBy?.lastName || 'Inconnu',
            email: report.reportedBy?.email || 'email@inconnu.com'
          },
          timestamp: report.timestamp || report.createdAt || new Date().toISOString()
        }));
        console.log('Processed reports:', processedReports);
        setReports(processedReports);
      } else {
        console.log('No real reports, using mock data');
        // Add mock data for testing when no real reports exist
        const mockReports = [
          {
            _id: '1',
            id: '1',
            reportedUser: {
              id: 'user1',
              firstName: 'Jean',
              lastName: 'Dupont',
              email: 'jean.dupont@example.com'
            },
            reportedBy: {
              id: 'reporter1',
              firstName: 'Marie',
              lastName: 'Martin',
              email: 'marie.martin@example.com'
            },
            reason: 'Harcèlement ou intimidation',
            description: 'Cet utilisateur envoie des messages inappropriés et harcelants dans les conversations privées.',
            timestamp: new Date().toISOString(),
            status: 'pending',
            severity: 'high',
            evidenceImage: null
          },
          {
            _id: '2',
            id: '2',
            reportedUser: {
              id: 'user2',
              firstName: 'Pierre',
              lastName: 'Durand',
              email: 'pierre.durand@example.com'
            },
            reportedBy: {
              id: 'reporter2',
              firstName: 'Sophie',
              lastName: 'Bernard',
              email: 'sophie.bernard@example.com'
            },
            reason: 'Spam ou publicité non sollicitée',
            description: 'Envoie constamment des messages publicitaires non sollicités.',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            status: 'pending',
            severity: 'medium',
            evidenceImage: null
          },
          {
            _id: '3',
            id: '3',
            reportedUser: {
              id: 'user3',
              firstName: 'Lucas',
              lastName: 'Moreau',
              email: 'lucas.moreau@example.com'
            },
            reportedBy: {
              id: 'reporter3',
              firstName: 'Emma',
              lastName: 'Leroy',
              email: 'emma.leroy@example.com'
            },
            reason: 'Comportement abusif',
            description: 'Utilise un langage inapproprié et irrespectueux envers les autres utilisateurs.',
            timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            status: 'resolved',
            severity: 'medium',
            action: 'warn',
            actionReason: 'Premier avertissement pour comportement inapproprié'
          }
        ];
        console.log('Using mock reports:', mockReports);
        setReports(mockReports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      console.log('Using fallback mock data due to error');
      // Add mock data even on error for testing
      const mockReports = [
        {
          _id: '1',
          id: '1',
          reportedUser: {
            id: 'user1',
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@example.com'
          },
          reportedBy: {
            id: 'reporter1',
            firstName: 'Marie',
            lastName: 'Martin',
            email: 'marie.martin@example.com'
          },
          reason: 'Harcèlement ou intimidation',
          description: 'Cet utilisateur envoie des messages inappropriés et harcelants dans les conversations privées.',
          timestamp: new Date().toISOString(),
          status: 'pending',
          severity: 'high',
          evidenceImage: null
        }
      ];
      console.log('Using fallback mock reports:', mockReports);
      setReports(mockReports);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId, action, reason = '') => {
    try {
      // Simulate API call
      console.log('Action taken:', { reportId, action, reason });
      
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'resolved', action, actionReason: reason }
          : report
      ));

      const actionMessages = {
        warn: 'Utilisateur averti avec succès',
        ban: 'Utilisateur banni avec succès',
        dismiss: 'Signalement rejeté'
      };

      showNotification(actionMessages[action], 'success');
      setShowActionModal(false);
      setSelectedReport(null);
    } catch (error) {
      showNotification('Erreur lors de l\'action', 'error');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSearch = !searchQuery || (
      report.reportedUser?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedUser?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesStatus && matchesSearch;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // View Modal Component
  const ViewModal = () => {
    if (!showViewModal || !selectedReport) return null;

    console.log('ViewModal selectedReport:', selectedReport);
    console.log('ViewModal reportedUser:', selectedReport.reportedUser);
    console.log('ViewModal reportedBy:', selectedReport.reportedBy);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Détails du signalement
            </h3>
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedReport(null);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Reported User Info */}
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Utilisateur signalé
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white font-semibold text-lg">
                  {String(selectedReport.reportedUser?.firstName || '?').charAt(0)}{String(selectedReport.reportedUser?.lastName || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {String(selectedReport.reportedUser?.firstName || 'N/A')} {String(selectedReport.reportedUser?.lastName || 'N/A')}
                  </p>
                  <p className="text-sm text-slate-600">{String(selectedReport.reportedUser?.email || 'N/A')}</p>
                  <p className="text-xs text-slate-500">ID: {String(selectedReport.reportedUser?.id || 'N/A')}</p>
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">Motif du signalement</h5>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getSeverityColor(selectedReport.severity)}`}>
                  {String(selectedReport.reason || 'N/A')}
                </span>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">Niveau de gravité</h5>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getSeverityColor(selectedReport.severity)}`}>
                  {selectedReport.severity === 'high' ? 'Élevé' : selectedReport.severity === 'medium' ? 'Moyen' : 'Faible'}
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">Statut</h5>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                  {selectedReport.status === 'pending' ? 'En attente' : selectedReport.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">Date du signalement</h5>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedReport.timestamp ? new Date(selectedReport.timestamp).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Date inconnue'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h5 className="font-medium text-slate-900 mb-3">Description détaillée</h5>
              <p className="text-sm text-slate-700 leading-relaxed">
                {String(selectedReport.description || 'Aucune description')}
              </p>
            </div>

            {/* Reporter Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Signalé par
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                  {String(selectedReport.reportedBy?.firstName || '?').charAt(0)}{String(selectedReport.reportedBy?.lastName || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {String(selectedReport.reportedBy?.firstName || 'N/A')} {String(selectedReport.reportedBy?.lastName || 'N/A')}
                  </p>
                  <p className="text-sm text-slate-600">{String(selectedReport.reportedBy?.email || 'N/A')}</p>
                </div>
              </div>
            </div>

            {/* Evidence */}
            {selectedReport.evidenceImage && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-3">Preuve jointe</h5>
                <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-4 text-center">
                  <img 
                    src={`http://localhost:5000/uploads/reports/${selectedReport.evidenceImage}`}
                    alt="Preuve du signalement"
                    className="max-w-full h-auto rounded-lg mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Action Taken */}
            {selectedReport.action && (
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Action prise
                </h5>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Type d'action :</span> {
                      selectedReport.action === 'warn' ? 'Avertissement' : 
                      selectedReport.action === 'ban' ? 'Bannissement' : 'Rejeté'
                    }
                  </p>
                  {selectedReport.actionReason && (
                    <p className="text-sm">
                      <span className="font-medium">Raison :</span> {String(selectedReport.actionReason)}
                    </p>
                  )}
                  {selectedReport.actionTakenAt && (
                    <p className="text-sm text-slate-500">
                      Action prise le {new Date(selectedReport.actionTakenAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {selectedReport.status === 'pending' && (
            <div className="border-t border-slate-200 p-6">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setActionType('warn');
                    setShowActionModal(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-200"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Avertir
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setActionType('ban');
                    setShowActionModal(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                >
                  <Ban className="h-4 w-4" />
                  Bannir
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setActionType('dismiss');
                    setShowActionModal(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                  Rejeter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  const ActionModal = () => {
    const [actionReason, setActionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (actionType === 'warn' || actionType === 'ban') {
        if (!actionReason.trim()) {
          showNotification('Veuillez fournir une raison', 'error');
          return;
        }
      }

      setIsSubmitting(true);
      await handleAction(selectedReport.id, actionType, actionReason);
      setIsSubmitting(false);
    };

    if (!showActionModal) return null;

    const actionTitles = {
      warn: 'Avertir l\'utilisateur',
      ban: 'Bannir l\'utilisateur',
      dismiss: 'Rejeter le signalement'
    };

    const actionColors = {
      warn: 'bg-orange-600 hover:bg-orange-700',
      ban: 'bg-red-600 hover:bg-red-700',
      dismiss: 'bg-gray-600 hover:bg-gray-700'
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              {actionTitles[actionType]}
            </h3>
            <button
              onClick={() => {
                setShowActionModal(false);
                setSelectedReport(null);
                setActionReason('');
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-4">
                Utilisateur concerné : <span className="font-medium">
                  {selectedReport?.reportedUser?.firstName || 'N/A'} {selectedReport?.reportedUser?.lastName || 'N/A'}
                </span>
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Motif du signalement : <span className="font-medium">
                  {selectedReport?.reason}
                </span>
              </p>
            </div>

            {(actionType === 'warn' || actionType === 'ban') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Raison de l'action *
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Expliquez la raison de cette action..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedReport(null);
                  setActionReason('');
                }}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white ${actionColors[actionType]} disabled:opacity-50`}
              >
                {isSubmitting ? 'En cours...' : actionTitles[actionType]}
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
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-slate-600">Chargement des signalements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NotificationComponent />
      <ViewModal />
      <ActionModal />
      
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Signalements</h1>
          <p className="mt-2 text-slate-600">
            Gérez les signalements d'utilisateurs et prenez les actions appropriées
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom d'utilisateur ou motif..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="resolved">Résolus</option>
                <option value="dismissed">Rejetés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Flag className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">
                  Aucun signalement trouvé
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Aucun résultat pour vos critères de recherche'
                    : 'Aucun signalement pour le moment'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredReports.map((report) => {
                console.log('Rendering report:', report);
                return (
                <div key={report._id || report.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white font-semibold">
                          {(report.reportedUser?.firstName || '?').charAt(0)}{(report.reportedUser?.lastName || '?').charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {report.reportedUser?.firstName || 'N/A'} {report.reportedUser?.lastName || 'N/A'}
                          </h3>
                          <p className="text-sm text-slate-500">{report.reportedUser?.email || 'N/A'}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityColor(report.severity)}`}>
                            {report.severity === 'high' ? 'Élevé' : report.severity === 'medium' ? 'Moyen' : 'Faible'}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status === 'pending' ? 'En attente' : report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          Motif : {report.reason || 'N/A'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {report.description || 'Aucune description'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {report.timestamp ? new Date(report.timestamp).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Date inconnue'}
                        </span>
                        <span>
                          Signalé par : {report.reportedBy?.firstName || 'N/A'} {report.reportedBy?.lastName || 'N/A'}
                        </span>
                      </div>

                      {report.action && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700">
                            Action prise : {report.action === 'warn' ? 'Avertissement' : report.action === 'ban' ? 'Bannissement' : 'Rejeté'}
                          </p>
                          {report.actionReason && (
                            <p className="text-sm text-slate-600 mt-1">{report.actionReason}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          console.log('Selected report for view:', report);
                          setSelectedReport(report);
                          setShowViewModal(true);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('warn');
                              setShowActionModal(true);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-orange-100 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-200"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Avertir
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('ban');
                              setShowActionModal(true);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                          >
                            <Ban className="h-4 w-4" />
                            Bannir
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('dismiss');
                              setShowActionModal(true);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                          >
                            <X className="h-4 w-4" />
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}