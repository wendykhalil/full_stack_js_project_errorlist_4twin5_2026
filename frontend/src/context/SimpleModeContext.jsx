import React, { createContext, useContext, useState, useEffect } from 'react';

const SimpleModeContext = createContext();

export const useSimpleMode = () => {
  const context = useContext(SimpleModeContext);
  if (!context) {
    throw new Error('useSimpleMode must be used within a SimpleModeProvider');
  }
  return context;
};

export const SimpleModeProvider = ({ children }) => {
  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    const saved = localStorage.getItem('bmp_simple_mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('bmp_simple_mode', JSON.stringify(isSimpleMode));
    
    // Apply simple mode styles to document
    if (isSimpleMode) {
      document.documentElement.classList.add('simple-mode');
    } else {
      document.documentElement.classList.remove('simple-mode');
    }
  }, [isSimpleMode]);

  const toggleSimpleMode = () => {
    setIsSimpleMode(prev => !prev);
  };

  return (
    <SimpleModeContext.Provider value={{ isSimpleMode, toggleSimpleMode }}>
      {children}
    </SimpleModeContext.Provider>
  );
};