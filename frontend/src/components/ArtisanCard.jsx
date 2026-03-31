import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Star,
  Navigation
} from 'lucide-react';

export default function ArtisanCard({ artisan, onContact }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const artisanRating = Number(artisan?.rating ?? artisan?.avgRating ?? 4.8);
  const normalizedArtisanRating = Number.isFinite(artisanRating) ? Math.max(0, Math.min(5, artisanRating)) : 4.8;
  const artisanStarCount = Math.round(normalizedArtisanRating);

  const renderArtisanStars = () => {
    return [0, 1, 2, 3, 4].map((index) => (
      <Star
        key={`artisan-star-${index}`}
        className={`h-4 w-4 ${index < artisanStarCount ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
      />
    ));
  };

  const handleClick = () => {
    navigate(`/prescripteur/artisan/${artisan._id}`);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-shadow">
      {/* En-tête avec photo */}
      <div className="p-6 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-4">
          {/* Photo de profil */}
          <div 
            onClick={handleClick}
            className="cursor-pointer flex-shrink-0"
          >
            {artisan.profileImage && !imageError ? (
              <img
                src={artisan.profileImage}
                alt={artisan.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-8 w-8 text-indigo-600" />
              </div>
            )}
          </div>

          {/* Informations principales */}
          <div className="flex-1 min-w-0" onClick={handleClick}>
            <h3 className="text-lg font-semibold text-slate-900 cursor-pointer hover:text-indigo-600">
              {artisan.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
              <Briefcase className="h-4 w-4" />
              <span>{artisan.trade}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
              <MapPin className="h-4 w-4" />
              <span>{artisan.region}</span>
            </div>
          </div>

          {/* Distance si disponible */}
          {artisan.distance && (
            <div className="flex-shrink-0">
              <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {artisan.distance.text || `${artisan.distance} km`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {artisan.description && (
        <div className="px-6 py-3 border-b border-slate-100">
          <p className="text-sm text-slate-600 line-clamp-2">
            {artisan.description}
          </p>
        </div>
      )}

      {/* Stats et actions */}
      <div className="p-4 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-semibold text-slate-900">
                {artisan.totalProjects || 0}
              </span>
              <span className="text-slate-500 ml-1">projets</span>
            </div>
            <div className="flex items-center gap-1">
              {renderArtisanStars()}
              <span className="text-sm font-medium">{normalizedArtisanRating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/prescripteur/artisan/${artisan._id}`)}
            className="flex-1 bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            Voir le profil
          </button>
          <button
            onClick={() => onContact && onContact(artisan)}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Contacter
          </button>
        </div>

        {/* Contact rapide */}
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          {artisan.phone && (
            <a href={`tel:${artisan.phone}`} className="flex items-center gap-1 hover:text-indigo-600">
              <Phone className="h-3 w-3" />
              <span>Appeler</span>
            </a>
          )}
          <span className="text-slate-300">•</span>
          <button className="flex items-center gap-1 hover:text-indigo-600">
            <Mail className="h-3 w-3" />
            <span>Message</span>
          </button>
        </div>
      </div>
    </div>
  );
}