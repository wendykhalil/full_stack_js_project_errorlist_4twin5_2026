import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

const VoiceInput = ({ onResult, placeholder = "Cliquez sur le micro et parlez...", className = "" }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fr-FR';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);
        
        if (finalTranscript && onResult) {
          onResult(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult]);

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) return;
    
    setTranscript('');
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!isSupported || !recognitionRef.current) return;
    
    recognitionRef.current.stop();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        La reconnaissance vocale n'est pas supportée par votre navigateur.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleListening}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isListening
              ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
          }`}
          aria-label={isListening ? "Arrêter l'écoute" : "Commencer l'écoute vocale"}
        >
          {isListening ? (
            <>
              <Square className="h-4 w-4" />
              Arrêter
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              🎤 Parler
            </>
          )}
        </button>
        
        {isListening && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            Écoute en cours...
          </div>
        )}
      </div>

      {transcript && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-sm text-gray-600 mb-1">Texte reconnu:</div>
          <div className="text-gray-900">{transcript}</div>
        </div>
      )}

      {!isListening && !transcript && (
        <div className="text-sm text-gray-500 italic">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;