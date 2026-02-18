import React from "react";
import { Search, ChevronDown, MapPin, Star, Phone, User } from "lucide-react";

const PillSelect = ({ placeholder }) => (
  <div className="relative w-full">
    <select className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none">
      <option>{placeholder}</option>
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
);

const ArtisanCard = ({ name, job, city, projects, years, rating }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <User className="h-6 w-6" />
        </div>
        <div>
          <div className="text-base font-semibold text-slate-900">{name}</div>
          <div className="mt-1 text-sm text-slate-500">{job}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
        <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
        {rating}
      </div>
    </div>

    <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
      <MapPin className="h-4 w-4 text-slate-400" />
      {city}
    </div>

    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <div>{projects} projets réalisés</div>
      <div>{years} ans d'expérience</div>
    </div>

    <div className="mt-5 h-px w-full bg-slate-200" />

    <div className="mt-5 flex flex-col gap-3">
      <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
        <Phone className="h-4 w-4" />
        Contacter
      </button>

      <button className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-700 py-3 text-sm font-semibold text-white hover:bg-indigo-800">
        Voir le profil
      </button>
    </div>
  </div>
);

export default function PrescripteurArtisans() {
  return (
    <main className="mx-auto max-w-6xl py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Trouver un Artisan</h1>
      <p className="mt-2 text-sm text-slate-500">
        Recherchez des artisans qualifiés par spécialité et région
      </p>

      {/* Filters */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Rechercher un artisan..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="w-full md:w-72">
            <PillSelect placeholder="Toutes spécialités" />
          </div>

          <div className="w-full md:w-64">
            <PillSelect placeholder="Toutes régions" />
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ArtisanCard
          name="Ali Ben Salem"
          job="Plomberie"
          city="Tunis"
          projects={45}
          years={12}
          rating="4.8"
        />
        <ArtisanCard
          name="Mohamed Trabelsi"
          job="Électricité"
          city="Ariana"
          projects={67}
          years={15}
          rating="4.9"
        />
        <ArtisanCard
          name="Karim Gharbi"
          job="Maçonnerie"
          city="Ben Arous"
          projects={38}
          years={10}
          rating="4.7"
        />
      </div>
    </main>
  );
}
