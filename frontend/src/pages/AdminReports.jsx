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
      
      if (data.data) {
        setReports(data.data);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Start with empty array instead of mock data
      setReports([]);
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

  // Action Modal Component
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
                  {selectedReport?.reportedUser.firstName} {selectedReport?.reportedUser.lastName}
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
              {filteredReports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white font-semibold">
                          {report.reportedUser.firstName.charAt(0)}{report.reportedUser.lastName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {report.reportedUser.firstName} {report.reportedUser.lastName}
                          </h3>
                          <p className="text-sm text-slate-500">{report.reportedUser.email}</p>
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
                          Motif : {report.reason}
                        </p>
                        <p className="text-sm text-slate-600">
                          {report.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {report.timestamp.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>
                          Signalé par : {report.reportedBy.firstName} {report.reportedBy.lastName}
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

                    {report.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
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
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}