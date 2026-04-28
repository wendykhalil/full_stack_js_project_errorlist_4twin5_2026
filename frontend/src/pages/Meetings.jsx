import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../auth/api';
import { Calendar, Clock, User, CheckCircle, XCircle, Clock as ClockIcon, Loader2, AlertCircle, ChevronDown, MapPin, MessageSquare, Trash2, Search, X } from 'lucide-react';
import meetingsService from '../services/meetingsService';
import { Hint } from '../components/MouseTooltip';
import { MeetingModal } from '../components/MeetingModal';

const STATUS_COLORS = {
  PENDING: { bg: 'bg-gradient-to-br from-yellow-50 to-amber-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-200 text-yellow-900 font-bold' },
  ACCEPTED: { bg: 'bg-gradient-to-br from-emerald-50 to-green-50', border: 'border-emerald-300', text: 'text-emerald-800', badge: 'bg-emerald-200 text-emerald-900 font-bold' },
  REJECTED: { bg: 'bg-gradient-to-br from-rose-50 to-red-50', border: 'border-rose-300', text: 'text-rose-800', badge: 'bg-rose-200 text-rose-900 font-bold' },
  COMPLETED: { bg: 'bg-gradient-to-br from-indigo-50 to-blue-50', border: 'border-indigo-300', text: 'text-indigo-800', badge: 'bg-indigo-200 text-indigo-900 font-bold' },
  CANCELLED: { bg: 'bg-gradient-to-br from-slate-100 to-slate-50', border: 'border-slate-300', text: 'text-slate-800', badge: 'bg-slate-300 text-slate-900 font-bold' },
};

const STATUS_LABELS = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  COMPLETED: 'Complétée',
  CANCELLED: 'Annulée',
};

function MeetingCard({ meeting, isArtisan, onAccept, onReject, onCancel, onDelete, onOpenMeeting, loading }) {
  const [expandNotes, setExpandNotes] = useState(false);
  const colors = STATUS_COLORS[meeting.status] || STATUS_COLORS.PENDING;

  const startDate = new Date(meeting.startDateTime);
  const endDate = new Date(meeting.endDateTime);

  const isUpcoming = startDate > new Date();
  const canActon = meeting.status === 'PENDING' && isArtisan && isUpcoming;

  const otherUser = isArtisan ? meeting.prescripteurId : meeting.artisanId;

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 backdrop-blur-sm dark:border-slate-700`}>
      <div className="p-4">
        {/* Header with status */}
        <div className="flex items-start justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700 border-opacity-50">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {meeting.title || 'Réunion'}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${colors.badge}`}>
                {STATUS_LABELS[meeting.status]}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              avec <span className="font-semibold text-slate-800 dark:text-slate-200">{otherUser?.firstName} {otherUser?.lastName}</span>
            </p>
          </div>
        </div>

        {/* Meeting details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 p-2 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-lg hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-colors">
            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="text-xs font-medium">
              {startDate.toLocaleDateString('fr-TN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 p-2 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-lg hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-colors">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="text-xs font-medium">
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
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 p-2 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-lg hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-colors">
              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="text-xs font-medium">{otherUser.phone}</span>
            </div>
          )}

          {otherUser?.email && (
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 p-2 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-lg hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-colors">
              <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="text-xs font-medium break-all">{otherUser.email}</span>
            </div>
          )}
        </div>

          {meeting.googleMeetLink && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 border-opacity-50">
              <Hint text="Rejoindre la réunion en visioconférence via Google Meet.">
              <button
                onClick={() => onOpenMeeting(meeting)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 hover:from-blue-700 hover:via-blue-700 hover:to-cyan-700 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95 border-b-4 border-blue-800"
              >
                <span>🎥</span>
                <span>Rejoindre</span>
              </button>
              </Hint>
            </div>
          )}

        {/* Description */}
        {meeting.description && (
          <div className="mb-3 p-2 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 border-opacity-50">
            <p className="text-xs text-slate-700 font-medium leading-relaxed">{meeting.description}</p>
          </div>
        )}

        {/* Notes (for rejected meetings) */}
        {meeting.notes && (
          <div className="mb-3">
            <button
              onClick={() => setExpandNotes(!expandNotes)}
              className="flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-slate-900 transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${expandNotes ? 'rotate-180' : ''}`} />
              Remarques
            </button>
            {expandNotes && (
              <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 border-opacity-50">
                <p className="text-xs text-slate-700 leading-relaxed">{meeting.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500 border-t border-slate-200 border-opacity-50 pt-2">
          {meeting.acceptedAt && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Acceptée: {new Date(meeting.acceptedAt).toLocaleDateString('fr-TN')}</span>
          )}
          {meeting.rejectedAt && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Refusée: {new Date(meeting.rejectedAt).toLocaleDateString('fr-TN')}</span>
          )}
          {meeting.createdAt && (
            <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">Créée: {new Date(meeting.createdAt).toLocaleDateString('fr-TN')}</span>
          )}
        </div>

        {/* Actions */}
        <>
          {canActon && (
            <div className="flex gap-2">
              <Hint text="Confirmer votre participation à cette réunion et notifier le prescripteur.">
              <button
                onClick={() => onAccept(meeting._id)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white px-3 py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-xs font-bold transform hover:scale-105 active:scale-95 border-b-2 border-emerald-800"
              >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Accepter
              </button>
              </Hint>
              <Hint text="Décliner cette invitation de réunion et notifier le prescripteur.">
              <button
                onClick={() => onReject(meeting._id)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-red-600 via-red-600 to-pink-600 hover:from-red-700 hover:via-red-700 hover:to-pink-700 text-white px-3 py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-xs font-bold transform hover:scale-105 active:scale-95 border-b-2 border-red-800"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Refuser
              </button>
              </Hint>
            </div>
          )}

          {meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && !canActon && (
            <div className="flex gap-2">
              <button
                onClick={() => onCancel(meeting._id)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-xs font-bold hover:shadow-md transform hover:scale-105 active:scale-95 border-b-2 border-slate-700"
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
                className="flex-1 flex items-center justify-center gap-1 border-2 border-red-400 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-xs font-bold hover:shadow-md transform hover:scale-105 active:scale-95"
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
              className="w-full flex items-center justify-center gap-1 border-2 border-red-400 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-xs font-bold hover:shadow-md transform hover:scale-105 active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Supprimer
            </button>
          )}
        </>
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
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

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
      
      // Accept the meeting
      await meetingsService.acceptMeeting(meetingId);
      
      // Reload to get fresh meeting data with populated fields
      await loadMeetings();
      
      // Find the meeting to get details for calendar
      const updatedMeetings = await meetingsService.getArtisanMeetings();
      const meeting = updatedMeetings.meetings?.find(m => m._id === meetingId);
      
      console.log('Meeting found:', meeting);
      
      if (meeting && meeting.startDateTime) {
        // Extract date in local timezone (YYYY-MM-DD format)
        const meetingDate = new Date(meeting.startDateTime);
        const year = meetingDate.getFullYear();
        const month = String(meetingDate.getMonth() + 1).padStart(2, "0");
        const day = String(meetingDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        
        // Extract time
        const startTime = meetingDate.toLocaleTimeString('fr-TN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        
        // Get prescripteur name - handle both populated and unpopulated scenarios
        let prescripteurName = 'Expert';
        if (meeting.prescripteurId) {
          if (typeof meeting.prescripteurId === 'object' && meeting.prescripteurId.firstName) {
            prescripteurName = `${meeting.prescripteurId.firstName} ${meeting.prescripteurId.lastName}`;
          } else if (typeof meeting.prescripteurId === 'string') {
            prescripteurName = 'Expert';
          }
        }
        
        // Create note
        const note = `Réunion avec ${prescripteurName} - ${startTime}`;
        
        // Get time slot (determine if morning, afternoon, or evening based on start time)
        const hour = meetingDate.getHours();
        const timeSlots = {
          morning: hour >= 8 && hour < 12,
          afternoon: hour >= 12 && hour < 17,
          evening: hour >= 17 && hour < 21,
        };
        
        console.log('Marking calendar with:', { dateStr, note, timeSlots });
        
        // Mark availability as BOOKED
        try {
          const token = localStorage.getItem('bmptn_token');
          if (token) {
            const response = await apiFetch("/availability", { 
              token,
              method: "POST", 
              body: { 
                date: dateStr, 
                status: "BOOKED", 
                note,
                timeSlots
              } 
            });
            console.log('Calendar marked successfully:', response);
          } else {
            console.error('No token found');
          }
        } catch (calendarError) {
          console.error('Error marking calendar:', calendarError);
        }
      } else {
        console.error('Meeting data incomplete:', meeting);
      }
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
      
      // Also remove from availability calendar
      const meeting = meetings.find(m => m._id === meetingId);
      if (meeting) {
        const meetingDate = new Date(meeting.startDateTime);
        const year = meetingDate.getFullYear();
        const month = String(meetingDate.getMonth() + 1).padStart(2, "0");
        const day = String(meetingDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        
        try {
          const token = localStorage.getItem('bmptn_token');
          if (token) {
            await apiFetch(`/availability/${dateStr}`, { 
              token, 
              method: "DELETE" 
            });
          }
        } catch (calendarError) {
          console.error('Error removing from calendar:', calendarError);
          // Don't fail if calendar removal fails
        }
      }
      
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

  const filteredMeetings = meetings.filter(meeting => {
    // Filter by status
    const statusMatch = filterStatus === 'all' || meeting.status === filterStatus;
    
    // Filter by search term (title or participant name)
    const searchMatch = searchTerm === '' || 
      meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.artisanId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.artisanId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.prescripteurId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.prescripteurId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by date
    const dateMatch = !selectedDate || 
      new Date(meeting.startDateTime).toLocaleDateString('fr-TN') === new Date(selectedDate).toLocaleDateString('fr-TN');
    
    return statusMatch && searchMatch && dateMatch;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-600 font-medium">Chargement des réunions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
          {isArtisan ? 'Demandes de réunion reçues' : 'Réunions planifiées'}
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 font-medium">
          {isArtisan
            ? 'Gérez les demandes de réunion des prescripteurs'
            : 'Suivez et gérez vos réunions planifiées avec les artisans'}
        </p>
      </div>

      {error && (
        <div className="mb-8 rounded-2xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800/50 p-5 flex items-center gap-4 shadow-md">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
        </div>
      )}

      {/* Search and Date Filter */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par titre ou participant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 transition-colors"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
        {['all', 'PENDING', 'ACCEPTED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-6 py-3 rounded-xl whitespace-nowrap text-sm font-bold transition-all duration-300 transform ${
              filterStatus === status
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg hover:shadow-xl scale-105 dark:shadow-indigo-900/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-md'
            }`}
          >
            {status === 'all' ? 'Toutes' : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Meetings list */}
      {filteredMeetings.length === 0 ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 p-16 text-center">
          <Calendar className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
            {filterStatus === 'all'
              ? isArtisan
                ? 'Aucune demande de réunion pour le moment'
                : 'Aucune réunion planifiée'
              : `Aucune réunion ${STATUS_LABELS[filterStatus]?.toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {filteredMeetings.map(meeting => (
            <MeetingCard
              key={meeting._id}
              meeting={meeting}
              isArtisan={isArtisan}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onOpenMeeting={setSelectedMeeting}
              loading={actionLoading === meeting._id}
            />
          ))}
        </div>
      )}

      <MeetingModal
        isOpen={!!selectedMeeting}
        googleMeetLink={selectedMeeting?.googleMeetLink}
        meetingTitle={selectedMeeting?.title}
        onClose={() => setSelectedMeeting(null)}
      />
    </div>
  );
}
