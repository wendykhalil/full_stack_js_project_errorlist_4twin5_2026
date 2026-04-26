import React from 'react';
import MLPredictions from '../components/MLPredictions';
import { Brain, TrendingUp, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { Hint } from '../components/MouseTooltip';

const MLPredictionsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Brain className="text-blue-600" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prédictions IA pour Projets
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Utilisez l'intelligence artificielle pour obtenir des estimations précises 
            de durée et de coût pour vos projets de construction et rénovation.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Hint text="Estimez simultanément la durée et le coût de votre projet selon son type, sa taille et sa complexité.">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="text-blue-600" size={24} />
              <h3 className="font-semibold text-gray-900">Durée &amp; Coût</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Obtenez en une seule analyse la durée estimée en jours et le coût total en Dinar Tunisien pour votre projet.
            </p>
          </div>
          </Hint>

          <Hint text="Évaluez la probabilité de retard de votre projet en analysant la complexité, le budget et les délais.">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-red-600" size={24} />
              <h3 className="font-semibold text-gray-900">Risque de Retard</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Évaluez le risque de retard de votre projet en analysant les facteurs 
              de complexité, budget, délais et conditions météorologiques.
            </p>
          </div>
          </Hint>
        </div>

        {/* Main Component */}
        <MLPredictions />

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Comment ça marche ?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Prédiction de Durée</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Analysez le type de projet (maison, rénovation, etc.)</li>
                <li>Considérez la taille en mètres carrés</li>
                <li>Évaluez l'impact du nombre d'ouvriers</li>
                <li>Ajustez selon la complexité du projet</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Prédiction de Prix</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Calculez selon le type et la surface du projet</li>
                <li>Intégrez le coût des matériaux choisis</li>
                <li>Ajustez selon la localisation géographique</li>
                <li>Considérez la complexité technique</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Risque de Retard</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Analyse la pression temporelle (délai vs réalité)</li>
                <li>Évalue l'expérience de l'artisan</li>
                <li>Considère les conditions météorologiques</li>
                <li>Intègre les contraintes budgétaires</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note :</strong> Ces prédictions sont des estimations basées sur des modèles d'IA. 
            Les coûts et durées réels peuvent varier selon les conditions spécifiques du projet, 
            les fournisseurs locaux, et d'autres facteurs non pris en compte par le modèle.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MLPredictionsPage;