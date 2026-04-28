import React from 'react';
import MLPredictions from '../components/MLPredictions';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Info, CheckCircle, Clock, DollarSign } from 'lucide-react';
import SimpleFooter from '../components/Footer';

const MLPredictionsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 rounded-2xl">
              <Brain className="text-blue-600" size={36} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Prédictions IA pour vos Projets
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Notre intelligence artificielle analyse des milliers de projets similaires pour vous fournir
            des estimations fiables de durée, de coût et de risque de retard — adaptées au marché tunisien.
          </p>
        </div>

        {/* Intro explanation banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 shrink-0 mt-0.5" size={22} />
            <div>
              <h2 className="font-semibold text-blue-900 mb-2">Comment utiliser cet outil ?</h2>
              <p className="text-blue-800 text-sm leading-relaxed">
                Renseignez les caractéristiques de votre projet (type, surface, localisation, complexité) et notre modèle IA
                calculera automatiquement une estimation personnalisée. Vous pouvez aussi sélectionner un projet existant
                pour pré-remplir les champs automatiquement. Plus vos données sont précises, plus les prédictions seront fiables.
              </p>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <TrendingUp className="text-blue-600" size={22} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Durée &amp; Coût estimés</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Obtenez en une seule analyse la durée estimée en jours et le coût total en Dinar Tunisien (TND).
              Le modèle prend en compte le type de projet, la surface, les matériaux, la localisation et la complexité.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Estimation basée sur des projets réels en Tunisie</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Résultat en quelques secondes</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Utile pour préparer vos devis clients</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="text-red-600" size={22} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Risque de Retard</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Évaluez la probabilité que votre projet prenne du retard avant même de commencer.
              Le modèle analyse la pression temporelle, l'expérience de l'artisan, la saison et les contraintes budgétaires.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Risque faible, moyen ou élevé avec probabilités</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Facteurs de risque détaillés et expliqués</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Recommandations concrètes pour réduire les risques</li>
            </ul>
          </div>
        </div>

        {/* Main Component */}
        <MLPredictions />

        {/* How it works */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="text-amber-500" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Comment fonctionne l'IA ?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-700">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="text-blue-500" size={18} />
                <h4 className="font-semibold text-gray-900">Prédiction de Durée</h4>
              </div>
              <ul className="space-y-2 list-disc list-inside text-gray-600">
                <li>Analyse le type de projet (maison, rénovation, commercial…)</li>
                <li>Prend en compte la surface en m² et le nombre d'ouvriers</li>
                <li>Ajuste selon la complexité et la localisation</li>
                <li>Résultat exprimé en jours ouvrables estimés</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="text-emerald-500" size={18} />
                <h4 className="font-semibold text-gray-900">Prédiction de Coût</h4>
              </div>
              <ul className="space-y-2 list-disc list-inside text-gray-600">
                <li>Calcule selon le type et la surface du projet</li>
                <li>Intègre le niveau de qualité des matériaux choisis</li>
                <li>Ajuste selon la zone géographique (rural, banlieue, urbain)</li>
                <li>Résultat en Dinar Tunisien (TND)</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="text-red-500" size={18} />
                <h4 className="font-semibold text-gray-900">Risque de Retard</h4>
              </div>
              <ul className="space-y-2 list-disc list-inside text-gray-600">
                <li>Analyse la pression temporelle (délai demandé vs réaliste)</li>
                <li>Évalue l'expérience de l'artisan en années</li>
                <li>Considère les conditions saisonnières</li>
                <li>Intègre les contraintes budgétaires et la taille du projet</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendations section */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="text-green-600 shrink-0 mt-0.5" size={22} />
            <div>
              <h3 className="font-semibold text-green-900 mb-3">Conseils pour de meilleures prédictions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">→</span> Saisissez la surface réelle du projet, pas une estimation approximative</li>
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">→</span> Choisissez le niveau de complexité honnêtement — sous-estimer augmente le risque de retard</li>
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">→</span> Indiquez le nombre d'ouvriers que vous prévoyez réellement d'affecter</li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">→</span> Pour un projet existant, utilisez "Projet existant" pour pré-remplir automatiquement</li>
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">→</span> Comparez les deux onglets (Durée &amp; Coût + Risque de Retard) pour une vision complète</li>
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">→</span> Utilisez ces estimations comme base de négociation avec vos clients</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            <strong>Note importante :</strong> Ces prédictions sont des estimations générées par un modèle d'intelligence artificielle.
            Les coûts et durées réels peuvent varier selon les conditions spécifiques du chantier, les prix des fournisseurs locaux,
            les imprévus techniques et d'autres facteurs non pris en compte par le modèle. Utilisez ces résultats comme guide,
            non comme engagement contractuel.
          </p>
        </div>

      </div>
      <SimpleFooter />
    </div>
  );
};

export default MLPredictionsPage;
