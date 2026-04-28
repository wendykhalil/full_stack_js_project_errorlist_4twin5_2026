import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public info pages — lazy loaded so they don't bloat the main bundle
const About       = lazy(() => import("./pages/About"));
const HowItWorks  = lazy(() => import("./pages/HowItWorks"));
const Pricing     = lazy(() => import("./pages/Pricing"));
const Contact     = lazy(() => import("./pages/Contact"));
const Privacy     = lazy(() => import("./pages/Privacy"));
const Terms       = lazy(() => import("./pages/Terms"));
import RealtimeNotifications from "./components/RealtimeNotifications";
import ArtisanLocationPromptModal from "./components/ArtisanLocationPromptModal";
import ReadPageButton from "./components/ReadPageButton";
import ArtisanProfile from './pages/ArtisanProfile';
import MLPredictionsPage from './pages/MLPredictions';

import Login from "./pages/Login";
import PhoneLogin from "./pages/PhoneLogin";
import RegisterRole from "./pages/RegisterRole";
import VerifyEmail from "./pages/VerifyEmail";
import Unauthorized from "./pages/Unauthorized";

import ProtectedRoute from "./components/ProtectedRoute";
import { Roles } from "./auth/role";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminArtisanDashboard from "./pages/AdminArtisanDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminActivityLogs from "./pages/AdminActivityLogs";
import AdminPromoCodes from "./pages/AdminPromoCodes";
import AdminTransactions from "./pages/AdminTransactions";
import AdminReports from "./pages/AdminReports";
import AdminDisputes from "./pages/AdminDisputes";
import AdminAiInsights from "./pages/AdminAiInsights";
import AdminUserStatisticsPage from "./pages/AdminUserStatistics";
import AdminFraudAnalytics from "./pages/AdminFraudAnalytics";
import FaceIdDemo from "./pages/FaceIdDemo";

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
import ArtisanCart from "./pages/ArtisanCart";
import ArtisanFavorites from "./pages/ArtisanFavorites";
import ArtisanSubscription from './pages/ArtisanSubscription';
import RequireSubscription from './components/RequireSubscription';

import ArtisanProfileEdit from './pages/ArtisanProfileEdit';
import ArtisanPortfolio from './pages/ArtisanPortfolio';
import ArtisanPortfolioAdd from './pages/ArtisanPortfolioAdd';
import ArtisanWeather from './pages/ArtisanWeather';
import ArtisanAvailability from './pages/ArtisanAvailability';
import ArtisanServiceRequests from './pages/ArtisanServiceRequests';
import PrescripteurServiceRequests from './pages/PrescripteurServiceRequests';
import MyDisputes from './pages/MyDisputes';
import Meetings from './pages/Meetings';

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
import AccessibilityDemo from "./pages/AccessibilityDemo";
import AppErrorBoundary from "./components/AppErrorBoundary";
import AiChat from "./components/ai-chat"; // ton composant chat modernisé
import { MouseTooltipProvider } from "./components/MouseTooltip";
import { DarkModeProvider } from "./contexts/DarkModeContext";

export default function App() {
    return (
        <DarkModeProvider>
        <AppErrorBoundary>
        <MouseTooltipProvider>
        <BrowserRouter>
            <AppErrorBoundary></AppErrorBoundary>
            <AppErrorBoundary><RealtimeNotifications /></AppErrorBoundary>
            <AppErrorBoundary><ArtisanLocationPromptModal /></AppErrorBoundary>
            <ReadPageButton />
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
                <Route path="/accessibility-demo" element={<AccessibilityDemo />} />
                <Route path="/faceid-demo" element={<FaceIdDemo />} />
                {/* La route AiChat a été retirée d'ici : elle est maintenant dans chaque layout protégé */}

                {/* Public info pages — SPA navigation, no reload */}
                <Route path="/about"         element={<Suspense fallback={null}><About /></Suspense>} />
                <Route path="/how-it-works"  element={<Suspense fallback={null}><HowItWorks /></Suspense>} />
                <Route path="/pricing"       element={<Suspense fallback={null}><Pricing /></Suspense>} />
                <Route path="/contact"       element={<Suspense fallback={null}><Contact /></Suspense>} />
                <Route path="/privacy"       element={<Suspense fallback={null}><Privacy /></Suspense>} />
                <Route path="/terms"         element={<Suspense fallback={null}><Terms /></Suspense>} />

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
                        <Route path="artisans" element={<AdminArtisanDashboard />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="accessibility" element={<AccessibilitySettings />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="activity" element={<AdminActivityLogs />} />
                        <Route path="transactions" element={<AdminTransactions />} />
                        <Route path="promo-codes" element={<AdminPromoCodes />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="disputes" element={<AdminDisputes />} />
                        <Route path="ai-insights" element={<AdminAiInsights />} />
                        <Route path="fraud-analytics" element={<AdminFraudAnalytics />} />
                        <Route path="user-statistics" element={<AdminUserStatisticsPage />} />
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
                        <Route path="cart" element={<RequireSubscription><ArtisanCart /></RequireSubscription>} />
                        <Route path="favorites" element={<ArtisanFavorites />} />
                        <Route path="weather" element={<ArtisanWeather />} />
                        <Route path="availability" element={<ArtisanAvailability />} />
                        <Route path="service-requests" element={<ArtisanServiceRequests />} />
                        <Route path="disputes" element={<MyDisputes />} />
                        <Route path="meetings" element={<Meetings />} />
                        <Route path="ml-predictions" element={<MLPredictionsPage />} />
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
                        <Route path="disputes" element={<MyDisputes />} />
                        <Route path="meetings" element={<Meetings />} />
                        <Route path="ml-predictions" element={<MLPredictionsPage />} />
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
        </MouseTooltipProvider>
        </AppErrorBoundary>
        </DarkModeProvider>
    );
}