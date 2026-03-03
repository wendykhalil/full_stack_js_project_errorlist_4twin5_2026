import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TawkToChat from "./components/TawkToChat";
import RealtimeNotifications from "./components/RealtimeNotifications";

import Login from "./pages/Login";
import PhoneLogin from "./pages/PhoneLogin";
import RegisterRole from "./pages/RegisterRole";
import VerifyEmail from "./pages/VerifyEmail";
import Unauthorized from "./pages/Unauthorized";

import ProtectedRoute from "./components/ProtectedRoute";
import { Roles } from "./auth/role";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminActivityLogs from "./pages/AdminActivityLogs";

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
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FournisseurProduitNew from "./pages/FournisseurProduitNew";
import Profile from "./pages/Profile";

export default function App() {
    return (
        <BrowserRouter>
          <TawkToChat />

            {/* Widget Tawk.to - visible sur toutes les pages */}
           
            <RealtimeNotifications />
            <Routes>
                {/* Routes publiques */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login-phone" element={<PhoneLogin />} />
                <Route path="/register-role" element={<RegisterRole />} />
                {/* backward-compatible */}
                <Route path="/register-role-sms" element={<RegisterRole />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/profile" element={<Profile />} />

                {/* Register */}
                <Route path="/register" element={<RegisterChooseRole />} />
                <Route path="/register/:role" element={<RegisterForm />} />

                {/* ✅ SOLUTION 1: Redirection pour /artisandeviscreate */}
                <Route 
                    path="/artisandeviscreate" 
                    element={<Navigate to="/artisan/devis/create" replace />} 
                />

                {/* ✅ SOLUTION 2: Aussi ajouter cette redirection au cas où */}
                <Route 
                    path="/artisan/deviscreate" 
                    element={<Navigate to="/artisan/devis/create" replace />} 
                />

                {/* Admin (protected) */}
                <Route element={<ProtectedRoute allowedRoles={[Roles.ADMIN]} />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="activity" element={<AdminActivityLogs />} />
                        <Route
                            path="transactions"
                            element={<div className="mx-auto max-w-6xl py-10">Transactions (à faire)</div>}
                        />
                    </Route>
                </Route>

                {/* Artisan (protected) */}
                <Route element={<ProtectedRoute allowedRoles={[Roles.ARTISAN]} />}>
                    <Route path="/artisan" element={<ArtisanLayout />}>
                        <Route index element={<ArtisanDashboard />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="projects" element={<ArtisanProjects />} />
                        <Route path="devis/create" element={<ArtisanDevisCreate />} />
                        <Route path="factures" element={<ArtisanFactures />} />
                        <Route path="factures/new" element={<ArtisanFactureStep1 />} />
                        <Route path="factures/new/step-2" element={<ArtisanFactureStep2 />} />
                        <Route path="factures/new/step-3" element={<ArtisanFactureStep3 />} />
                        <Route path="marketplace" element={<ArtisanMarketplace />} />
                    </Route>
                </Route>

                {/* Prescripteur (protected) */}
                <Route element={<ProtectedRoute allowedRoles={[Roles.PRESCRIPTEUR]} />}>
                    <Route path="/prescripteur" element={<PrescripteurLayout />}>
                        <Route index element={<PrescripteurProduits />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="artisans" element={<PrescripteurArtisans />} />
                    </Route>
                </Route>

                {/* Fournisseur (protected) */}
                <Route element={<ProtectedRoute allowedRoles={[Roles.SUPPLIER]} />}>
                    <Route path="/fournisseur" element={<FournisseurLayout />}>
                        <Route index element={<Navigate to="produits" replace />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="produits" element={<FournisseurProduits />} />
                        <Route path="produits/new" element={<FournisseurProduitNew />} />
                    </Route>
                </Route>

                {/* Route par défaut - redirige vers login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}