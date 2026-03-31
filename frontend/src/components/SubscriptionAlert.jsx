import React from 'react';
import { AlertTriangle, Crown, X } from 'lucide-react';

const SubscriptionAlert = ({
  isVisible,
  onClose,
  title = "Abonnement requis",
  message = "Cette fonctionnalité nécessite un abonnement actif.",
  actionText = "Souscrire maintenant",
  onAction
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-100 p-3">
            <Crown className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Plus tard
          </button>
          <button
            onClick={onAction}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionAlert;