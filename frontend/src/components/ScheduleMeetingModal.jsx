import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import meetingsService from '../services/meetingsService';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const AVAILABILITY_STATUS = {
  AVAILABLE: { label: 'Disponible', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  BUSY: { label: 'Occupé', color: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  BOOKED: { label: 'Réservé', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

export default function ScheduleMeetingModal({ artisanId, artisanName, onClose, onSuccess }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);

  const [availability, setAvailability] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState(null);

  // Load availability on mount and month change
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        const data = await meetingsService.getArtisanAvailability(artisanId, monthStr);
        
        if (data && data.ok) {
          // Handle both direct array and wrapped object
          const availArray = Array.isArray(data.availability) ? data.availability : (data.availability || []);
          const meetingsArray = Array.isArray(data.meetings) ? data.meetings : (data.meetings || []);
          
          setAvailability(availArray.map(item => ({
            ...item,
            date: typeof item.date === 'string' ? item.date : new Date(item.date).toISOString().slice(0, 10)
          })));
          setMeetings(meetingsArray);
        } else {
          setAvailability([]);
          setMeetings([]);
        }
      } catch (err) {
        console.error('Error loading availability:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Erreur lors du chargement de la disponibilité';
        setError(errorMsg);
        // Set empty arrays so the calendar still works
        setAvailability([]);
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [artisanId, currentDate]);

  // Get days in current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Check if date is available
  const isDateAvailable = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const avail = availability.find(
      a => new Date(a.date) >= dayStart && new Date(a.date) <= dayEnd
    );

    return !avail || avail.status === 'AVAILABLE';
  };

  // Get availability status for a date
  const getDateAvailabilityStatus = (date) => {
    const dateStr = date.toISOString().slice(0, 10);
    const avail = availability.find(a => {
      const aDate = typeof a.date === 'string' ? a.date.slice(0, 10) : new Date(a.date).toISOString().slice(0, 10);
      return aDate === dateStr;
    });
    return avail?.status || 'AVAILABLE';
  };

  // Check if date is in the past
  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if time slot is available
  const isTimeSlotAvailable = (date, startTime) => {
    if (!date || !startTime) return false;

    const [hour, minute] = startTime.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hour, minute, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + duration);

    // Check for conflicting meetings
    return !meetings.some(meeting => {
      const meetingStart = new Date(meeting.startDateTime);
      const meetingEnd = new Date(meeting.endDateTime);

      return (
        (slotStart < meetingEnd && slotEnd > meetingStart)
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleSelectDate = (date) => {
    if (isDateInPast(date) || !isDateAvailable(date)) return;
    setSelectedDate(date);
    setSelectedStartTime(null);
    setSelectedEndTime(null);
  };

  const handleSelectTime = (time) => {
    if (!isTimeSlotAvailable(selectedDate, time)) return;
    setSelectedStartTime(time);

    // Calculate end time based on duration
    const [hour, minute] = time.split(':').map(Number);
    const endDate = new Date(selectedDate);
    endDate.setHours(hour, minute + duration);
    const endHour = String(endDate.getHours()).padStart(2, '0');
    const endMinute = String(endDate.getMinutes()).padStart(2, '0');
    setSelectedEndTime(`${endHour}:${endMinute}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      setError('Veuillez sélectionner une date et une heure');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const startDateTime = new Date(selectedDate);
      const [startHour, startMinute] = selectedStartTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(selectedDate);
      const [endHour, endMinute] = selectedEndTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const result = await meetingsService.createMeeting({
        artisanId,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        description,
        duration,
      });

      if (result && result.ok) {
        setCreatedMeeting(result.meeting);
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(result?.message || 'Erreur lors de la création de la réunion');
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de la création de la réunion';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const days = getDaysInMonth();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Planifier une réunion avec {artisanName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          {success && (
            <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">Réunion planifiée avec succès!</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Un email de confirmation a été envoyé à l'artisan.</p>
                </div>
              </div>
              {createdMeeting?.googleMeetLink && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800/50">
                  <p className="text-xs text-green-700 dark:text-green-400 mb-2">Lien de la réunion:</p>
                  <a
                    href={createdMeeting.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    🎥 Ouvrir la réunion
                  </a>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Calendar */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Sélectionner une date
                </h3>
                <p className="text-sm text-slate-600 mb-4">Basé sur la disponibilité de {artisanName}</p>

                {/* Month selector */}
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h4 className="text-lg font-semibold">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h4>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAYS_SHORT.map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, idx) => {
                    if (!day) {
                      return <div key={`empty-${idx}`} className="aspect-square" />;
                    }

                    const isSelected = selectedDate && selectedDate.toDateString() === day.toDateString();
                    const isPast = isDateInPast(day);
                    const status = getDateAvailabilityStatus(day);
                    const isAvailable = status === 'AVAILABLE';
                    const canSelect = !isPast && isAvailable;
                    const statusMeta = AVAILABILITY_STATUS[status] || AVAILABILITY_STATUS.AVAILABLE;

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleSelectDate(day)}
                        disabled={!canSelect}
                        title={isPast ? 'Date passée' : statusMeta.label}
                        className={`aspect-square rounded-lg font-medium text-sm flex flex-col items-center justify-center transition-colors relative ${
                          isSelected
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                            : canSelect
                            ? 'bg-white border-2 border-emerald-300 text-slate-900 hover:bg-emerald-50'
                            : isPast
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            : `${statusMeta.bg} border-2 cursor-not-allowed`
                        }`}
                      >
                        <span>{day.getDate()}</span>
                        {!isPast && !isSelected && (
                          <span className={`h-2 w-2 rounded-full ${statusMeta.color} mt-0.5`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                  {Object.entries(AVAILABILITY_STATUS).map(([key, val]) => (
                    <span key={key} className="inline-flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${val.color}`} />
                      <span className="text-slate-600">{val.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Time selector */}
              {selectedDate && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    Sélectionner une heure
                  </h3>

                  <p className="text-sm text-slate-600 mb-4">
                    {selectedDate.toLocaleDateString('fr-TN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {TIMES.map(time => {
                      const isSelected = selectedStartTime === time;
                      const canSelect = isTimeSlotAvailable(selectedDate, time);

                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => handleSelectTime(time)}
                          disabled={!canSelect}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : canSelect
                              ? 'bg-slate-100 text-slate-900 hover:bg-indigo-100'
                              : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>

                  {selectedStartTime && (
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                      Heure de fin: <span className="font-semibold">{selectedEndTime}</span> (durée: {duration} min)
                    </p>
                  )}
                </div>
              )}

              {/* Duration and description */}
              {selectedDate && selectedStartTime && (
                <div className="mb-8 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Durée (minutes)
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => {
                        setDuration(Number(e.target.value));
                        // Recalculate end time
                        const [hour, minute] = selectedStartTime.split(':').map(Number);
                        const endDate = new Date(selectedDate);
                        endDate.setHours(hour, minute + Number(e.target.value));
                        const endHour = String(endDate.getHours()).padStart(2, '0');
                        const endMinute = String(endDate.getMinutes()).padStart(2, '0');
                        setSelectedEndTime(`${endHour}:${endMinute}`);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 heure</option>
                      <option value={90}>1 h 30</option>
                      <option value={120}>2 heures</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Message (optionnel)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez le sujet de la réunion..."
                      rows="3"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selectedDate || !selectedStartTime || submitting}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Confirmer la réunion'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
