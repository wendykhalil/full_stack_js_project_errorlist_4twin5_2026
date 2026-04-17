import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { useSimpleMode } from '../context/SimpleModeContext';

const SimpleModeToggle = ({ className = "" }) => {
  const { isSimpleMode, toggleSimpleMode } = useSimpleMode();

  return (
    <button
      onClick={toggleSimpleMode}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isSimpleMode
          ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
          : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
      } ${className}`}
      aria-label={isSimpleMode ? "Désactiver le mode simple" : "Activer le mode simple"}
    >
      {isSimpleMode ? (
        <>
          <Smartphone className="h-4 w-4" />
          📱 Mode Simple
        </>
      ) : (
        <>
          <Monitor className="h-4 w-4" />
          Mode Normal
        </>
      )}
    </button>
  );
};

export default SimpleModeToggle;