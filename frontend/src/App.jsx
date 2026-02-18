import React from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";

// REGISTER
import RegisterChooseRole from "./pages/RegisterChooseRole";
import RegisterForm from "./pages/RegisterForm";

// ARTISAN
import ArtisanLayout from "./layouts/ArtisanLayout";
import ArtisanDashboard from "./pages/ArtisanDashboard";
import ArtisanProjects from "./pages/ArtisanProjects";
import ArtisanDevisCreate from "./pages/ArtisanDevisCreate";
import ArtisanFactures from "./pages/ArtisanFactures";
import ArtisanFactureStep1 from "./pages/ArtisanFactureStep1";
import ArtisanFactureStep2 from "./pages/ArtisanFactureStep2";
import ArtisanFactureStep3 from "./pages/ArtisanFactureStep3";
import ArtisanMarketplace from "./pages/ArtisanMarketplace";

// PRESCRIPTEUR
import PrescripteurLayout from "./layouts/PrescripteurLayout";
import PrescripteurProduits from "./pages/PrescripteurProduits";
import PrescripteurArtisans from "./pages/PrescripteurArtisans";

// FOURNISSEUR
import FournisseurLayout from "./layouts/FournisseurLayout";
import FournisseurProduits from "./pages/FournisseurProduits";
import FournisseurProduitNew from "./pages/FournisseurProduitNew";

const LinkBtn = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `rounded-xl px-3 py-2 text-sm font-semibold border ${
        isActive
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`
    }
  >
    {children}
  </NavLink>
);

export default function App() {
  return (
    <BrowserRouter>
      {/* Demo switch bar */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">BMP.tn</div>
          <div className="flex gap-2">
            <LinkBtn to="/login">Login</LinkBtn>
            <LinkBtn to="/register">Register</LinkBtn>
            <LinkBtn to="/admin">Admin</LinkBtn>
            <LinkBtn to="/artisan">Artisan</LinkBtn>
            <LinkBtn to="/prescripteur">Prescripteur</LinkBtn>
            <LinkBtn to="/fournisseur">Fournisseur</LinkBtn>
          </div>
        </div>
      </div>

      {/* ✅ ONE Routes only */}
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Register */}
        <Route path="/register" element={<RegisterChooseRole />} />
        <Route path="/register/:role" element={<RegisterForm />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="transactions" element={<div className="mx-auto max-w-6xl py-10">Transactions (à faire)</div>} />
</Route>


        {/* Artisan */}
        <Route path="/artisan" element={<ArtisanLayout />}>
          <Route index element={<ArtisanDashboard />} />
          <Route path="projects" element={<ArtisanProjects />} />
          <Route path="devis/create" element={<ArtisanDevisCreate />} />
          <Route path="factures" element={<ArtisanFactures />} />
          <Route path="factures/new" element={<ArtisanFactureStep1 />} />
          <Route path="factures/new/step-2" element={<ArtisanFactureStep2 />} />
          <Route path="factures/new/step-3" element={<ArtisanFactureStep3 />} />
          <Route path="marketplace" element={<ArtisanMarketplace />} />
        </Route>

        {/* Prescripteur */}
        <Route path="/prescripteur" element={<PrescripteurLayout />}>
          <Route index element={<PrescripteurProduits />} />
          <Route path="artisans" element={<PrescripteurArtisans />} />
        </Route>

        {/* Fournisseur */}
        <Route path="/fournisseur" element={<FournisseurLayout />}>
          <Route index element={<Navigate to="produits" replace />} />
          <Route path="produits" element={<FournisseurProduits />} />
          <Route path="produits/new" element={<FournisseurProduitNew />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
