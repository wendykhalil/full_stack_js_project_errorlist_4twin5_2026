import React from 'react';
import { useAuth } from '../auth/AuthContext';
import AdminUserStatistics from '../components/AdminUserStatistics';
import Footer from '../components/Footer';
import TextToSpeech from '../components/TextToSpeech';

export default function AdminUserStatisticsPage() {
  const { token } = useAuth();

  const pageDescription = "Cette page présente des statistiques détaillées sur l'utilisation de la plateforme par les utilisateurs. Vous pouvez voir qui sont les utilisateurs les plus actifs, les plus gros acheteurs, et identifier ceux qui sont inactifs.";

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              📊 Statistiques Utilisateurs Détaillées
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              {pageDescription}
            </p>
          </div>
          <TextToSpeech 
            text={`Statistiques Utilisateurs Détaillées. ${pageDescription}`}
            buttonText="🔊 Lire la page"
          />
        </div>
        
        {/* Simple Mode Step Indicator */}
        <div className="simple-step">
          <div className="simple-step-number">1</div>
          <div>
            <div className="font-semibold">Consultez les statistiques</div>
            <div className="text-sm text-slate-600">Analysez l'activité de vos utilisateurs ci-dessous</div>
          </div>
        </div>
      </div>

      <AdminUserStatistics token={token} />

      <Footer />
    </div>
  );
}