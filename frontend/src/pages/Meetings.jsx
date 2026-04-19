import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Loader2,
  AlertCircle,
  ChevronDown,
  MapPin,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import meetingsService from '../services/meetingsService';

const STATUS_COLORS = {
  PENDING: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' },
  ACCEPTED: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' },
  REJECTED: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' },
  COMPLETED: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100' },
  CANCELLED: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100' },
};

const STATUS_LABELS = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  COMPLETED: 'Complétée',
  CANCELLED: 'Annulée',
};

function MeetingCard({ meeting, isArtisan, onAccept, onReject, onCancel, onDelete, loading }) {
  const [expandNotes, setExpandNotes] = useState(false);
  const colors = STATUS_COLORS[meeting.status] || STATUS_COLORS.PENDING;

  const startDate = new Date(meeting.startDateTime);
  const endDate = new Date(meeting.endDateTime);

  const isUpcoming = startDate > new Date();
  const canActon = meeting.status === 'PENDING' && isArtisan && isUpcoming;

  const otherUser = isArtisan ? meeting.prescripteurId : meeting.artisanId;

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden hover:shadow-md transition-shadow`}>
      <div className="p-6">
        {/* Header with status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-slate-900">
                {meeting.title || 'Réunion'}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                {STATUS_LABELS[meeting.status]}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              avec {otherUser?.firstName} {otherUser?.lastName}
            </p>
          </div>
        </div>

        {/* Meeting details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-slate-600">
            <Calendar className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm">
              {startDate.toLocaleDateString('fr-TN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            <Clock className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm">
              {startDate.toLocaleTimeString('fr-TN', {
                hour: '2-digit',
                minute: '2-digit',
              })} - {endDate.toLocaleTimeString('fr-TN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {otherUser?.phone && (
            <div className="flex items-center gap-3 text-slate-600">
              <User className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <span className="text-sm">{otherUser.phone}</span>
            </div>
          )}

          {otherUser?.email && (
            <div className="flex items-center gap-3 text-slate-600">
              <MessageSquare className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <span className="text-sm">{otherUser.email}</span>
            </div>
          )}

          {meeting.googleMeetLink && (
            <div className="flex items-center gap-3">
              <a
                href={meeting.googleMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <span>🎥 Rejoindre la réunion</span>
              </a>
            </div>
          )}
        </div>

        {/* Description */}
        {meeting.description && (
          <div className="mb-6 p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-sm text-slate-700">{meeting.description}</p>
          </div>
        )}

        {/* Notes (for rejected meetings) */}
        {meeting.notes && (
          <div className="mb-6">
            <button
              onClick={() => setExpandNotes(!expandNotes)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${expandNotes ? 'rotate-180' : ''}`} />
              Remarques
            </button>
            {expandNotes && (
              <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">{meeting.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="mb-6 flex flex-wrap gap-4 text-xs text-slate-500">
          {meeting.acceptedAt && (
            <span>Acceptée: {new Date(meeting.acceptedAt).toLocaleDateString('fr-TN')}</span>
          )}
          {meeting.rejectedAt && (
            <span>Refusée: {new Date(meeting.rejectedAt).toLocaleDateString('fr-TN')}</span>
          )}
          {meeting.createdAt && (
            <span>Créée: {new Date(meeting.createdAt).toLocaleDateString('fr-TN')}</span>
          )}
        </div>

        {/* Actions */}
        {canActon && (
          <div className="flex gap-3">
            <button
              onClick={() => onAccept(meeting._id)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Accepter
            </button>
            <button
              onClick={() => onReject(meeting._id)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Refuser
            </button>
          </div>
        )}

        {meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && !canActon && (
          <div className="flex gap-3">
            <button
              onClick={() => onCancel(meeting._id)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 border border-slate-300 bg-slate-50 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              Annuler
            </button>
            <button
              onClick={() => {
                if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réunion?')) {
                  onDelete(meeting._id);
                }
              }}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 border border-red-300 bg-red-50 text-red-700 px-4 py-3 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Supprimer
            </button>
          </div>
        )}
        {(meeting.status === 'COMPLETED' || meeting.status === 'CANCELLED') && (
          <button
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réunion?')) {
                onDelete(meeting._id);
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 border border-red-300 bg-red-50 text-red-700 px-4 py-3 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

export default function Meetings() {
  const { user } = useAuth();
  const isArtisan = user?.role === 'ARTISAN';

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Load meetings
  useEffect(() => {
    loadMeetings();
  }, [isArtisan]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      try {
        if (isArtisan) {
          response = await meetingsService.getArtisanMeetings();
        } else {
          response = await meetingsService.getPrescripteurMeetings();
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        const message = apiError.response?.data?.message || apiError.message || 'Erreur réseau';
        throw new Error(message);
      }

      if (response && response.meetings) {
        setMeetings(response.meetings);
      } else {
        setMeetings([]);
      }
    } catch (err) {
      console.error('Error loading meetings:', err);
      setError(err.message || 'Erreur lors du chargement des réunions');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (meetingId) => {
    try {
      setActionLoading(meetingId);
      setError(null);
      await meetingsService.acceptMeeting(meetingId);
      await loadMeetings();
    } catch (err) {
      console.error('Error accepting meeting:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'acceptation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (meetingId) => {
    try {
      setActionLoading(meetingId);
      setError(null);
      await meetingsService.rejectMeeting(meetingId, '');
      await loadMeetings();
    } catch (err) {
      console.error('Error rejecting meeting:', err);
      setError(err.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (meetingId) => {
    try {
      setActionLoading(meetingId);
      setError(null);
      await meetingsService.cancelMeeting(meetingId);
      await loadMeetings();
    } catch (err) {
      console.error('Error cancelling meeting:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (meetingId) => {
    try {
      setActionLoading(meetingId);
      setError(null);
      await meetingsService.cancelMeeting(meetingId); // Uses DELETE endpoint
      await loadMeetings();
    } catch (err) {
      console.error('Error deleting meeting:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMeetings = filterStatus === 'all'
    ? meetings
    : meetings.filter(m => m.status === filterStatus);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">
          {isArtisan ? 'Demandes de réunion reçues' : 'Réunions planifiées'}
        </h1>
        <p className="mt-2 text-slate-600">
          {isArtisan
            ? 'Gérez les demandes de réunion des prescripteurs'
            : 'Suivez et gérez vos réunions planifiées avec les artisans'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {['all', 'PENDING', 'ACCEPTED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status === 'all' ? 'Toutes' : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Meetings list */}
      {filteredMeetings.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-slate-500">
            {filterStatus === 'all'
              ? isArtisan
                ? 'Aucune demande de réunion pour le moment'
                : 'Aucune réunion planifiée'
              : `Aucune réunion ${STATUS_LABELS[filterStatus]?.toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMeetings.map(meeting => (
            <MeetingCard
              key={meeting._id}
              meeting={meeting}
              isArtisan={isArtisan}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
              onDelete={handleDelete}
              loading={actionLoading === meeting._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
