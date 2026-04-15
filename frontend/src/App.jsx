import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RealtimeNotifications from "./components/RealtimeNotifications";
import ArtisanProfile from './pages/ArtisanProfile';

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
import AdminPromoCodes from "./pages/AdminPromoCodes";
import AdminTransactions from "./pages/AdminTransactions";
import AdminReports from "./pages/AdminReports";

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
import ArtisanProductDetails from "./pages/ArtisanProductDetails";
import ArtisanOrderRequest from "./pages/ArtisanOrderRequest";
import ArtisanOrders from "./pages/ArtisanOrders";
import ArtisanSubscription from './pages/ArtisanSubscription';
import RequireSubscription from './components/RequireSubscription';

import ArtisanProfileEdit from './pages/ArtisanProfileEdit';
import ArtisanPortfolio from './pages/ArtisanPortfolio';
import ArtisanPortfolioAdd from './pages/ArtisanPortfolioAdd';
import ArtisanWeather from './pages/ArtisanWeather';
import ArtisanAvailability from './pages/ArtisanAvailability';
import ArtisanServiceRequests from './pages/ArtisanServiceRequests';
import PrescripteurServiceRequests from './pages/PrescripteurServiceRequests';

// PRESCRIPTEUR
import PrescripteurLayout from "./layouts/PrescripteurLayout";
import PrescripteurProduits from "./pages/PrescripteurProduits";
import PrescripteurArtisans from "./pages/PrescripteurArtisans";
import PrescripteurProjects from "./pages/PrescripteurProjects";
import PrescripteurSearch from './pages/PrescripteurSearch';
import ArtisanPublicProfile from './pages/ArtisanPublicProfile';
import PrescripteurProductDetails from './pages/PrescripteurProductDetails';

// FOURNISSEUR
import FournisseurLayout from "./layouts/FournisseurLayout";
import FournisseurDashboard from "./pages/FournisseurDashboard";
import FournisseurProduits from "./pages/FournisseurProduits";
import FournisseurProduitNew from "./pages/FournisseurProduitNew";
import FournisseurProduitEdit from "./pages/FournisseurProduitEdit";
import FournisseurOrders from "./pages/FournisseurOrders";
import FournisseurMarketplace from "./pages/FournisseurMarketplace";
import FournisseurProductDetails from "./pages/FournisseurProductDetails";
import OrderDetails from "./pages/OrderDetails";

// MESSAGERIE
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import AccessibilitySettings from "./pages/AccessibilitySettings";
import AppErrorBoundary from "./components/AppErrorBoundary";
import AiChat from "./components/ai-chat"; // ton composant chat modernisé

export default function App() {
    return (
        <AppErrorBoundary>
        <BrowserRouter>
            <AppErrorBoundary></AppErrorBoundary>
            <AppErrorBoundary><RealtimeNotifications /></AppErrorBoundary>
            <Routes>
                {/* Routes publiques */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login-phone" element={<PhoneLogin />} />
                <Route path="/register-role" element={<RegisterRole />} />
                <Route path="/register-role-sms" element={<RegisterRole />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/profile" element={<Profile />} />
                {/* La route AiChat a été retirée d'ici : elle est maintenant dans chaque layout protégé */}

                {/* Register */}
                <Route path="/register" element={<RegisterChooseRole />} />
                <Route path="/register/:role" element={<RegisterForm />} />

                {/* Redirections */}
                <Route 
                    path="/artisandeviscreate" 
                    element={<Navigate to="/artisan/devis/create" replace />} 
                />
                <Route 
                    path="/artisan/deviscreate" 
                    element={<Navigate to="/artisan/devis/create" replace />} 
                />

                {/* Admin (protected) */}
                <Route element={<ProtectedRoute allowedRoles={[Roles.ADMIN]} />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="accessibility" element={<AccessibilitySettings />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="activity" element={<AdminActivityLogs />} />
                        <Route path="transactions" element={<AdminTransactions />} />
                        <Route path="promo-codes" element={<AdminPromoCodes />} />
                        <Route path="reports" element={<AdminReports />} />
                        {/* AI Chat pour Admin */}
                        <Route path="AiChat" element={<AiChat />} />
                    </Route>
                </Route>

                {/* Artisan (protected) */}
                <Route element={<ProtectedRoute allowedRoles={[Roles.ARTISAN]} />}>
                    <Route path="/artisan" element={<ArtisanLayout />}>
                        <Route index element={<ArtisanDashboard />} />
                        <Route path="profile" element={<ArtisanProfile />} />
                        <Route path="accessibility" element={<AccessibilitySettings />} />
                        <Route path="profile/edit" element={<ArtisanProfileEdit />} />
                        <Route path="subscription" element={<ArtisanSubscription />} />
                        <Route path="marketplace" element={<ArtisanMarketplace />} />
                        <Route path="portfolio" element={<ArtisanPortfolio />} />
                        <Route path="portfolio/add" element={<ArtisanPortfolioAdd />} />
                        <Route path="portfolio/edit/:id" element={<ArtisanPortfolioAdd />} />
                        <Route path="projects" element={<ArtisanProjects />} />
                        <Route path="devis/create" element={<ArtisanDevisCreate />} />
                        <Route path="factures" element={<ArtisanFactures />} />
                        <Route path="factures/new" element={<ArtisanFactureStep1 />} />
                        <Route path="factures/new/step-2" element={<ArtisanFactureStep2 />} />
                        <Route path="factures/new/step-3" element={<ArtisanFactureStep3 />} />
                        <Route path="product/:id" element={<ArtisanProductDetails />} />
                        <Route path="order-request/:productId" element={<RequireSubscription><ArtisanOrderRequest /></RequireSubscription>} />
                        <Route path="orders" element={<RequireSubscription><ArtisanOrders /></RequireSubscription>} />
                        <Route path="orders/:id" element={<RequireSubscription><OrderDetails /></RequireSubscription>} />
                        <Route path="weather" element={<ArtisanWeather />} />
                        <Route path="availability" element={<ArtisanAvailability />} />
                        <Route path="service-requests" element={<ArtisanServiceRequests />} />
                        <Route path="messages" element={<RequireSubscription><Messages /></RequireSubscription>} />
                        <Route path="messages/:userId" element={<RequireSubscription><Conversation /></RequireSubscription>} />
                        {/* AI Chat pour Artisan */}
                        <Route path="AiChat" element={<AiChat />} />
                    </Route>
                </Route>

                {/* Prescripteur (protected) */}
                <Route element={<ProtectedRoute allowedRoles={[Roles.PRESCRIPTEUR]} />}>
                    <Route path="/prescripteur" element={<PrescripteurLayout />}>
                        <Route index element={<PrescripteurProduits />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="accessibility" element={<AccessibilitySettings />} />
                        <Route path="search" element={<PrescripteurSearch />} />
                        <Route path="artisan/:id" element={<ArtisanPublicProfile />} />
                        <Route path="artisans" element={<PrescripteurArtisans />} />
                        <Route path="product/:id" element={<PrescripteurProductDetails />} />
                        <Route path="projects" element={<PrescripteurProjects />} />
                        <Route path="service-requests" element={<PrescripteurServiceRequests />} />
                        <Route path="messages" element={<Messages />} />
                        <Route path="messages/:userId" element={<Conversation />} />
                        {/* AI Chat pour Prescripteur */}
                        <Route path="AiChat" element={<AiChat />} />
                    </Route>
                </Route>

                {/* Fournisseur (protected) */}
                <Route element={<ProtectedRoute allowedRoles={[Roles.SUPPLIER]} />}>
                    <Route path="/fournisseur" element={<FournisseurLayout />}>
                        <Route index element={<FournisseurDashboard />} />
                        <Route path="produits" element={<FournisseurProduits />} />
                        <Route path="produits/new" element={<FournisseurProduitNew />} />
                        <Route path="produits/edit/:id" element={<FournisseurProduitEdit />} />
                        <Route path="marketplace" element={<FournisseurMarketplace />} />
                        <Route path="product/:id" element={<FournisseurProductDetails />} />
                        <Route path="orders" element={<FournisseurOrders />} />
                        <Route path="orders/:id" element={<OrderDetails />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="accessibility" element={<AccessibilitySettings />} />
                        <Route path="messages" element={<Messages />} />
                        <Route path="messages/:userId" element={<Conversation />} />
                        {/* AI Chat pour Fournisseur */}
                        <Route path="AiChat" element={<AiChat />} />
                    </Route>
                </Route>

                {/* Route par défaut */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
        </AppErrorBoundary>
    );
}