import React from 'react';
import ReadCardButton from '../components/ReadCardButton';
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
            PrÃ©dictions IA pour vos Projets
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Notre intelligence artificielle analyse des milliers de projets similaires pour vous fournir
            des estimations fiables de durÃ©e, de coÃ»t et de risque de retard â€” adaptÃ©es au marchÃ© tunisien.
          </p>
        </div>

        {/* Intro explanation banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 shrink-0 mt-0.5" size={22} />
            <div>
              <div className="flex items-center justify-between"><h2 className="font-semibold text-blue-900 mb-2">Comment utiliser cet outil ?</h2><ReadCardButton text="Comment utiliser cet outil ?" /></div>
              <p className="text-blue-800 text-sm leading-relaxed">
                Renseignez les caractÃ©ristiques de votre projet (type, surface, localisation, complexitÃ©) et notre modÃ¨le IA
                calculera automatiquement une estimation personnalisÃ©e. Vous pouvez aussi sÃ©lectionner un projet existant
                pour prÃ©-remplir les champs automatiquement. Plus vos donnÃ©es sont prÃ©cises, plus les prÃ©dictions seront fiables.
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
              <h3 className="font-semibold text-gray-900 text-lg">DurÃ©e &amp; CoÃ»t estimÃ©s</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Obtenez en une seule analyse la durÃ©e estimÃ©e en jours et le coÃ»t total en Dinar Tunisien (TND).
              Le modÃ¨le prend en compte le type de projet, la surface, les matÃ©riaux, la localisation et la complexitÃ©.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Estimation basÃ©e sur des projets rÃ©els en Tunisie</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> RÃ©sultat en quelques secondes</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Utile pour prÃ©parer vos devis clients</li>
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
              Ã‰valuez la probabilitÃ© que votre projet prenne du retard avant mÃªme de commencer.
              Le modÃ¨le analyse la pression temporelle, l'expÃ©rience de l'artisan, la saison et les contraintes budgÃ©taires.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Risque faible, moyen ou Ã©levÃ© avec probabilitÃ©s</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Facteurs de risque dÃ©taillÃ©s et expliquÃ©s</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-500 shrink-0" size={15} /> Recommandations concrÃ¨tes pour rÃ©duire les risques</li>
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
                <h4 className="font-semibold text-gray-900">PrÃ©diction de DurÃ©e</h4>
              </div>
              <ul className="space-y-2 list-disc list-inside text-gray-600">
                <li>Analyse le type de projet (maison, rÃ©novation, commercialâ€¦)</li>
                <li>Prend en compte la surface en mÂ² et le nombre d'ouvriers</li>
                <li>Ajuste selon la complexitÃ© et la localisation</li>
                <li>RÃ©sultat exprimÃ© en jours ouvrables estimÃ©s</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="text-emerald-500" size={18} />
                <h4 className="font-semibold text-gray-900">PrÃ©diction de CoÃ»t</h4>
              </div>
              <ul className="space-y-2 list-disc list-inside text-gray-600">
                <li>Calcule selon le type et la surface du projet</li>
                <li>IntÃ¨gre le niveau de qualitÃ© des matÃ©riaux choisis</li>
                <li>Ajuste selon la zone gÃ©ographique (rural, banlieue, urbain)</li>
                <li>RÃ©sultat en Dinar Tunisien (TND)</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="text-red-500" size={18} />
                <h4 className="font-semibold text-gray-900">Risque de Retard</h4>
              </div>
              <ul className="space-y-2 list-disc list-inside text-gray-600">
                <li>Analyse la pression temporelle (dÃ©lai demandÃ© vs rÃ©aliste)</li>
                <li>Ã‰value l'expÃ©rience de l'artisan en annÃ©es</li>
                <li>ConsidÃ¨re les conditions saisonniÃ¨res</li>
                <li>IntÃ¨gre les contraintes budgÃ©taires et la taille du projet</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendations section */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="text-green-600 shrink-0 mt-0.5" size={22} />
            <div>
              <h3 className="font-semibold text-green-900 mb-3">Conseils pour de meilleures prÃ©dictions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">â†’</span> Saisissez la surface rÃ©elle du projet, pas une estimation approximative</li>
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">â†’</span> Choisissez le niveau de complexitÃ© honnÃªtement â€” sous-estimer augmente le risque de retard</li>
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">â†’</span> Indiquez le nombre d'ouvriers que vous prÃ©voyez rÃ©ellement d'affecter</li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">â†’</span> Pour un projet existant, utilisez "Projet existant" pour prÃ©-remplir automatiquement</li>
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">â†’</span> Comparez les deux onglets (DurÃ©e &amp; CoÃ»t + Risque de Retard) pour une vision complÃ¨te</li>
                  <li className="flex items-start gap-2"><span className="font-bold shrink-0">â†’</span> Utilisez ces estimations comme base de nÃ©gociation avec vos clients</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            <strong>Note importante :</strong> Ces prÃ©dictions sont des estimations gÃ©nÃ©rÃ©es par un modÃ¨le d'intelligence artificielle.
            Les coÃ»ts et durÃ©es rÃ©els peuvent varier selon les conditions spÃ©cifiques du chantier, les prix des fournisseurs locaux,
            les imprÃ©vus techniques et d'autres facteurs non pris en compte par le modÃ¨le. Utilisez ces rÃ©sultats comme guide,
            non comme engagement contractuel.
          </p>
        </div>

      </div>
      <SimpleFooter />
    </div>
  );
};

export default MLPredictionsPage;




