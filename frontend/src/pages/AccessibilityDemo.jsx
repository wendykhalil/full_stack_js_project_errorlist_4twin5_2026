import React, { useState } from 'react';
import { useSimpleMode } from '../context/SimpleModeContext';
import TextToSpeech from '../components/TextToSpeech';
import VoiceInput from '../components/VoiceInput';
import SimpleModeToggle from '../components/SimpleModeToggle';
import AccessibilityControls from '../components/AccessibilityControls';
import { Search, ShoppingCart, User, Settings } from 'lucide-react';

export default function AccessibilityDemo() {
  const { isSimpleMode } = useSimpleMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceResult, setVoiceResult] = useState('');

  const handleVoiceInput = (text) => {
    setVoiceResult(text);
    setSearchQuery(text);
  };

  const demoContent = {
    title: "Démonstration des Fonctionnalités d'Accessibilité",
    description: "Cette page présente toutes les nouvelles fonctionnalités d'accessibilité : lecture vocale, saisie vocale, mode simple, et contrôles d'accessibilité avancés.",
    searchPlaceholder: "Rechercher un artisan, produit ou service...",
    features: [
      {
        title: "🔊 Text-to-Speech (Lecture Vocale)",
        description: "Permet aux utilisateurs d'écouter le contenu de la page. Très utile pour les personnes malvoyantes ou qui préfèrent l'audio.",
        example: "Cliquez sur le bouton 'Lire' pour entendre cette description."
      },
      {
        title: "🎤 Voice Input (Saisie Vocale)",
        description: "Les utilisateurs peuvent parler au lieu de taper. Par exemple, dire 'Je cherche un plombier à Tunis' remplit automatiquement le champ de recherche.",
        example: "Utilisez le micro ci-dessous pour tester la saisie vocale."
      },
      {
        title: "📱 Mode Simple",
        description: "Interface simplifiée avec des boutons plus grands, moins d'éléments, et un flux étape par étape pour les débutants.",
        example: "Activez le mode simple pour voir la différence."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with TTS */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {demoContent.title}
              </h1>
              <p className="text-gray-600 text-lg">
                {demoContent.description}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <TextToSpeech 
                text={`${demoContent.title}. ${demoContent.description}`}
                buttonText="🔊 Lire la page"
              />
              <SimpleModeToggle />
            </div>
          </div>
        </div>

        {/* Simple Mode Steps */}
        {isSimpleMode && (
          <div className="space-y-4 mb-8">
            <div className="simple-step">
              <div className="simple-step-number">1</div>
              <div>
                <div className="font-semibold">Bienvenue dans le mode simple</div>
                <div className="text-sm text-slate-600">L'interface est maintenant plus simple et plus accessible</div>
              </div>
            </div>
            <div className="simple-step">
              <div className="simple-step-number">2</div>
              <div>
                <div className="font-semibold">Testez les fonctionnalités</div>
                <div className="text-sm text-slate-600">Utilisez les boutons ci-dessous pour découvrir les options</div>
              </div>
            </div>
          </div>
        )}

        {/* Search Demo with Voice Input */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 simple-mode-highlight">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Recherche avec Saisie Vocale</h2>
            <TextToSpeech 
              text="Section de recherche avec saisie vocale. Vous pouvez taper ou parler pour rechercher."
              buttonText="🔊"
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Que recherchez-vous ?
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={demoContent.searchPlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <VoiceInput 
              onResult={handleVoiceInput}
              placeholder="Dites par exemple: 'Je cherche un électricien à Tunis'"
            />
            
            {voiceResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-800">
                  <strong>Résultat vocal:</strong> {voiceResult}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {demoContent.features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <TextToSpeech 
                  text={`${feature.title}. ${feature.description}. ${feature.example}`}
                  buttonText="🔊"
                />
              </div>
              <p className="text-gray-600 mb-3">
                {feature.description}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <strong>Exemple:</strong> {feature.example}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons Demo */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Actions Principales</h2>
            <TextToSpeech 
              text="Section des actions principales avec des boutons accessibles"
              buttonText="🔊"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              <Search className="h-5 w-5" />
              Rechercher
            </button>
            <button className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              Commander
            </button>
            <button className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              <User className="h-5 w-5" />
              Mon Profil
            </button>
            <button className="flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
              <Settings className="h-5 w-5" />
              Paramètres
            </button>
          </div>
        </div>

        {/* Accessibility Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Contrôles d'Accessibilité</h2>
            <TextToSpeech 
              text="Panneau de contrôles d'accessibilité pour personnaliser votre expérience"
              buttonText="🔊"
            />
          </div>
          <AccessibilityControls />
        </div>

        {/* Hidden elements in simple mode */}
        <div className="simple-mode-hide mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Éléments Avancés (Cachés en Mode Simple)
          </h3>
          <p className="text-gray-600">
            Ces éléments complexes sont automatiquement cachés quand le mode simple est activé 
            pour éviter de surcharger l'interface.
          </p>
        </div>
      </div>
    </div>
  );
}