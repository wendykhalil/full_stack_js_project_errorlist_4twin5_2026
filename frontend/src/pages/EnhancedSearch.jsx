import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, Phone, Mail } from 'lucide-react';
import { useSimpleMode } from '../context/SimpleModeContext';
import TextToSpeech from '../components/TextToSpeech';
import VoiceInput from '../components/VoiceInput';
import SimpleModeToggle from '../components/SimpleModeToggle';

export default function EnhancedSearch() {
  const { isSimpleMode } = useSimpleMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    rating: 0
  });

  // Mock search results
  const mockResults = [
    {
      id: 1,
      name: 'Ahmed Ben Ali',
      type: 'Artisan',
      category: 'Plomberie',
      location: 'Tunis',
      rating: 4.8,
      reviews: 45,
      phone: '+216 20 123 456',
      email: 'ahmed.benali@email.com',
      description: 'Plombier expérimenté avec 15 ans d\'expérience. Spécialisé dans les installations sanitaires et réparations d\'urgence.',
      services: ['Installation sanitaire', 'Réparation fuite', 'Débouchage']
    },
    {
      id: 2,
      name: 'Fatma Trabelsi',
      type: 'Fournisseur',
      category: 'Matériaux de construction',
      location: 'Sfax',
      rating: 4.6,
      reviews: 78,
      phone: '+216 25 789 012',
      email: 'fatma.trabelsi@email.com',
      description: 'Fournisseur de matériaux de construction de qualité. Large gamme de produits pour tous vos projets.',
      services: ['Ciment', 'Carrelage', 'Peinture', 'Outils']
    },
    {
      id: 3,
      name: 'Mohamed Gharbi',
      type: 'Artisan',
      category: 'Électricité',
      location: 'Sousse',
      rating: 4.9,
      reviews: 62,
      phone: '+216 22 345 678',
      email: 'mohamed.gharbi@email.com',
      description: 'Électricien certifié pour installations domestiques et industrielles. Intervention rapide 24h/24.',
      services: ['Installation électrique', 'Dépannage', 'Mise aux normes']
    }
  ];

  const handleSearch = (query) => {
    setLoading(true);
    setSearchQuery(query);
    
    // Simulate API call
    setTimeout(() => {
      if (query.trim()) {
        const filtered = mockResults.filter(result => 
          result.name.toLowerCase().includes(query.toLowerCase()) ||
          result.category.toLowerCase().includes(query.toLowerCase()) ||
          result.location.toLowerCase().includes(query.toLowerCase()) ||
          result.services.some(service => service.toLowerCase().includes(query.toLowerCase()))
        );
        setSearchResults(filtered);
      } else {
        setSearchResults(mockResults);
      }
      setLoading(false);
    }, 800);
  };

  const handleVoiceInput = (text) => {
    handleSearch(text);
  };

  useEffect(() => {
    // Load initial results
    setSearchResults(mockResults);
  }, []);

  const pageDescription = "Recherchez des artisans, fournisseurs et services près de chez vous. Utilisez la recherche vocale ou tapez votre demande.";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🔍 Recherche Avancée
              </h1>
              <p className="text-gray-600 text-lg">
                {pageDescription}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <TextToSpeech 
                text={`Recherche Avancée. ${pageDescription}`}
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
                <div className="font-semibold">Recherchez ce que vous voulez</div>
                <div className="text-sm text-slate-600">Tapez ou parlez pour trouver des artisans et services</div>
              </div>
            </div>
            <div className="simple-step">
              <div className="simple-step-number">2</div>
              <div>
                <div className="font-semibold">Consultez les résultats</div>
                <div className="text-sm text-slate-600">Cliquez sur "Contacter" pour joindre un professionnel</div>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 simple-mode-highlight">
          <div className="flex items-center gap-2 mb-6">
            <Search className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Que recherchez-vous ?</h2>
            <TextToSpeech 
              text="Section de recherche. Vous pouvez taper votre recherche ou utiliser la saisie vocale."
              buttonText="🔊"
            />
          </div>

          <div className="space-y-6">
            {/* Text Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Recherche par mots-clés
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Ex: plombier à Tunis, électricien, matériaux de construction..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Voice Input */}
            <VoiceInput 
              onResult={handleVoiceInput}
              placeholder="Dites par exemple: 'Je cherche un électricien à Tunis' ou 'Fournisseur de carrelage à Sfax'"
            />

            {/* Search Button */}
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Rechercher
                </>
              )}
            </button>

            {/* Filters - Hidden in Simple Mode */}
            <div className="simple-mode-hide">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Filtres avancés</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select 
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes catégories</option>
                  <option value="plomberie">Plomberie</option>
                  <option value="electricite">Électricité</option>
                  <option value="construction">Construction</option>
                  <option value="peinture">Peinture</option>
                </select>
                
                <select 
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes régions</option>
                  <option value="tunis">Tunis</option>
                  <option value="sfax">Sfax</option>
                  <option value="sousse">Sousse</option>
                  <option value="bizerte">Bizerte</option>
                </select>
                
                <select 
                  value={filters.rating}
                  onChange={(e) => setFilters({...filters, rating: Number(e.target.value)})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Toutes notes</option>
                  <option value={4}>4+ étoiles</option>
                  <option value={4.5}>4.5+ étoiles</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Résultats de recherche ({searchResults.length})
            </h2>
            <TextToSpeech 
              text={`${searchResults.length} résultats trouvés pour votre recherche`}
              buttonText="🔊 Lire les résultats"
            />
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h3>
              <p className="text-gray-600">Essayez avec d'autres mots-clés ou utilisez la recherche vocale.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {searchResults.map((result) => (
                <div key={result.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{result.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.type === 'Artisan' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {result.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="font-medium">{result.category}</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {result.location}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{result.rating}</span>
                        </div>
                        <span className="text-sm text-gray-600">({result.reviews} avis)</span>
                      </div>
                    </div>
                    <TextToSpeech 
                      text={`${result.name}, ${result.type} spécialisé en ${result.category} à ${result.location}. Note ${result.rating} étoiles sur ${result.reviews} avis. ${result.description}`}
                      buttonText="🔊"
                    />
                  </div>

                  <p className="text-gray-600 mb-4">{result.description}</p>

                  <div className="mb-4 simple-mode-hide">
                    <div className="text-sm font-medium text-gray-900 mb-2">Services:</div>
                    <div className="flex flex-wrap gap-2">
                      {result.services.map((service, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1">
                      <Phone className="h-4 w-4" />
                      Appeler
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex-1">
                      <Mail className="h-4 w-4" />
                      Contacter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}