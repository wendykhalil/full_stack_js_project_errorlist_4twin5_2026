import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Notification({ notification, onClose }) {
  if (!notification) return null;

  const { message, type } = notification;
  const isSuccess = type === 'success';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`rounded-xl border p-4 shadow-lg ${
        isSuccess 
          ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30' 
          : 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30'
      }`}>
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
          <span className={`text-sm font-medium ${
            isSuccess ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'
          }`}>
            {message}
          </span>
          <button
            onClick={onClose}
            className={`ml-auto rounded-full p-1 transition-colors ${
              isSuccess 
                ? 'hover:bg-emerald-200 dark:hover:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400' 
                : 'hover:bg-red-200 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}