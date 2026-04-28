import React from 'react';
import { X, ExternalLink } from 'lucide-react';

export function MeetingModal({ isOpen, googleMeetLink, meetingTitle, onClose }) {
  if (!isOpen || !googleMeetLink) return null;

  // Extract meeting ID from Google Meet link
  const meetingId = googleMeetLink.split('/').pop();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-11/12 h-5/6 max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{meetingTitle || 'Réunion'}</h2>
            <p className="text-sm text-slate-600 mt-1">ID: {meetingId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        {/* Meeting Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <iframe
            src={googleMeetLink}
            title={meetingTitle || 'Google Meet'}
            allow="camera; microphone; clipboard-read; clipboard-write; payment"
            className="w-full h-full border-0"
          />
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
          <a
            href={googleMeetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Ouvrir dans un nouvel onglet
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
