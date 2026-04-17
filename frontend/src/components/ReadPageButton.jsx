import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const ReadPageButton = () => {
  const [isReading, setIsReading] = useState(false);

  const readWholePage = () => {
    if (isReading) {
      // Stop reading
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    // Try to find main content area (excluding sidebar/navigation)
    let contentElement = 
      document.querySelector('main') || 
      document.querySelector('[role="main"]') ||
      document.querySelector('.main-content') ||
      document.querySelector('#main-content') ||
      document.querySelector('.content') ||
      document.querySelector('article');

    // If no main content found, exclude common sidebar/nav elements
    if (!contentElement) {
      const elementsToExclude = [
        'nav', 'aside', '.sidebar', '#sidebar', 
        '.navigation', '.nav', '.menu', '.header-nav',
        '.breadcrumb', '.footer'
      ];
      
      // Clone body and remove excluded elements
      const bodyClone = document.body.cloneNode(true);
      elementsToExclude.forEach(selector => {
        const elements = bodyClone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
      contentElement = bodyClone;
    }

    const pageContent = contentElement.innerText
      .replace(/\s+/g, ' ') // Clean up whitespace
      .trim();

    if (!pageContent) {
      alert('Aucun contenu à lire sur cette page');
      return;
    }

    // Start reading
    const utterance = new SpeechSynthesisUtterance(pageContent);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={readWholePage}
      className={`fixed bottom-4 right-4 z-50 p-4 rounded-full shadow-lg transition-all duration-200 ${
        isReading 
          ? 'bg-red-600 hover:bg-red-700' 
          : 'bg-blue-600 hover:bg-blue-700'
      } text-white`}
      title={isReading ? 'Arrêter la lecture' : 'Lire toute la page'}
      aria-label={isReading ? 'Arrêter la lecture' : 'Lire toute la page'}
    >
      {isReading ? (
        <VolumeX className="h-6 w-6" />
      ) : (
        <Volume2 className="h-6 w-6" />
      )}
    </button>
  );
};

export default ReadPageButton;