import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

const TextToSpeech = ({ text, className = "", buttonText = "🔊 Lire" }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [utterance, setUtterance] = useState(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    const synth = window.speechSynthesis;
    
    const handleEnd = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    if (utterance) {
      utterance.addEventListener('end', handleEnd);
      return () => utterance.removeEventListener('end', handleEnd);
    }
  }, [utterance]);

  const speak = () => {
    if (!isSupported || !text) return;

    const synth = window.speechSynthesis;
    
    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      synth.pause();
      setIsPaused(true);
      setIsPlaying(false);
      return;
    }

    // Cancel any existing speech first
    synth.cancel();

    // Wait a bit for cancel to complete, then start new speech
    setTimeout(() => {
      const newUtterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a French voice
      const voices = synth.getVoices();
      const frenchVoice = voices.find(voice => 
        voice.lang.includes('fr') || voice.name.toLowerCase().includes('french')
      );
      
      if (frenchVoice) {
        newUtterance.voice = frenchVoice;
      }
      
      newUtterance.lang = 'fr-FR';
      newUtterance.rate = 0.8; // Slower for better understanding
      newUtterance.pitch = 1;
      newUtterance.volume = 1;
      
      // Add event listeners
      newUtterance.onstart = () => {
        console.log('TTS started');
        setIsPlaying(true);
      };
      
      newUtterance.onend = () => {
        console.log('TTS ended');
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      newUtterance.onerror = (event) => {
        console.error('TTS error:', event);
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      setUtterance(newUtterance);
      synth.speak(newUtterance);
    }, 100);
  };

  const stop = () => {
    if (!isSupported) return;
    
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={speak}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        aria-label={isPlaying ? "Pause la lecture" : isPaused ? "Reprendre la lecture" : "Lire le texte"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : isPaused ? (
          <Play className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
        {buttonText}
      </button>
      
      {(isPlaying || isPaused) && (
        <button
          onClick={stop}
          className="inline-flex items-center gap-1 rounded-lg bg-gray-600 px-2 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          aria-label="Arrêter la lecture"
        >
          <VolumeX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default TextToSpeech;