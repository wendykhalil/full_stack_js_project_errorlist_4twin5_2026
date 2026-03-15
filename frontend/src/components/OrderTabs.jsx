import React from 'react';

export default function OrderTabs({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-slate-200 mt-6">
      <div className="flex gap-4">
        <button
          onClick={() => onTabChange('active')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'active'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Commandes en cours
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Historique
        </button>
      </div>
    </div>
  );
}