import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300
        bg-gray-200 hover:bg-gray-300 text-gray-800
        dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        dark:focus:ring-offset-gray-800"
      title={isDarkMode ? 'Light mode' : 'Dark mode'}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun size={20} className="animate-spin-slow" />
      ) : (
        <Moon size={20} className="animate-pulse" />
      )}
    </button>
  );
}

export default DarkModeToggle;
