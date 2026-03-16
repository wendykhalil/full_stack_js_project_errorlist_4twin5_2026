import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function MessageLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header simple */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Messages</h1>
      </div>
      
      {/* Contenu */}
      <div className="p-4">
        <Outlet />
      </div>
    </div>
  );
}