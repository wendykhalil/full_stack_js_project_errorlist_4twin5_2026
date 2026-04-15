import React, { useState } from 'react';
import { 
  MoreVertical, 
  Archive, 
  ArchiveRestore, 
  BellOff, 
  Bell, 
  Trash2, 
  X 
} from 'lucide-react';

const MUTE_DURATIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 heure' },
  { value: 480, label: '8 heures' },
  { value: 1440, label: '1 jour' },
  { value: -1, label: 'Jusqu\'à ce que je le désactive' }
];

export default function ConversationOptionsMenu({ 
  conversation, 
  onArchive, 
  onUnarchive, 
  onMute, 
  onUnmute, 
  onDelete,
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState(false);

  const isArchived = conversation?.isArchived || false;
  const isMuted = conversation?.mutedUntil && new Date(conversation.mutedUntil) > new Date();

  const handleArchiveToggle = () => {
    if (isArchived) {
      onUnarchive?.(conversation.user._id);
    } else {
      onArchive?.(conversation.user._id);
    }
    setIsOpen(false);
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      onUnmute?.(conversation.user._id);
      setIsOpen(false);
    } else {
      setShowMuteOptions(true);
    }
  };

  const handleMuteDuration = (minutes) => {
    onMute?.(conversation.user._id, minutes);
    setShowMuteOptions(false);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      onDelete?.(conversation.user._id);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        title="Options"
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
                  onClick={handleArchiveToggle}
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
                  onClick={handleMuteToggle}
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
                  onClick={handleDelete}
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
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {MUTE_DURATIONS.map((duration) => (
                  <button
                    key={duration.value}
                    onClick={() => handleMuteDuration(duration.value)}
                    className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <BellOff className="h-4 w-4 text-orange-500 mr-3" />
                    <span>{duration.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}