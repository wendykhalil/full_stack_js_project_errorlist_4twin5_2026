import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ============================================================================
// LOADING FALLBACK COMPONENT
// ============================================================================
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// ============================================================================
// CRITICAL COMPONENTS - Load immediately (needed for routing)
// ============================================================================
import { Roles } from "./auth/role";

// ============================================================================
// LAZY LOAD ALL PAGES AND COMPONENTS
// ============================================================================

// Core Components (small, but still lazy load for optimization)
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const AppErrorBoundary = lazy(() => import("./components/AppErrorBoundary"));
const RealtimeNotifications = lazy(() => import("./components/RealtimeNotifications"));
const ArtisanLocationPromptModal = lazy(() => import("./components/ArtisanLocationPromptModal"));
const ReadPageButton = lazy(() => import("./components/ReadPageButton"));
const RequireSubscription = lazy(() => import("./components/RequireSubscription"));

// Context Providers
const MouseTooltipProvider = lazy(() => import("./components/MouseTooltip").then(m => ({ default: m.MouseTooltipProvider })));
const DarkModeProvider = lazy(() => import("./contexts/DarkModeContext").then(m => ({ default: m.DarkModeProvider })));

// Public Pages
const Login = lazy(() => import("./pages/Login"));
const PhoneLogin = lazy(() => import("./pages/PhoneLogin"));
const RegisterRole = lazy(() => import("./pages/RegisterRole"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const AccessibilitySettings = lazy(() => import("./pages/AccessibilitySettings"));
const AccessibilityDemo = lazy(() => import("./pages/AccessibilityDemo"));
const FaceIdDemo = lazy(() => import("./pages/FaceIdDemo"));

// Public Info Pages
const About = lazy(() => import("./pages/About"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

// Register Pages
const RegisterChooseRole = lazy(() => import("./pages/RegisterChooseRole"));
const RegisterForm = lazy(() => import("./pages/RegisterForm"));

// ============================================================================
// ADMIN PAGES - Lazy load all admin components
// ============================================================================
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminArtisanDashboard = lazy(() => import("./pages/AdminArtisanDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminActivityLogs = lazy(() => import("./pages/AdminActivityLogs"));
const AdminPromoCodes = lazy(() => import("./pages/AdminPromoCodes"));
const AdminTransactions = lazy(() => import("./pages/AdminTransactions"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminDisputes = lazy(() => import("./pages/AdminDisputes"));
const AdminAiInsights = lazy(() => import("./pages/AdminAiInsights"));
const AdminUserStatisticsPage = lazy(() => import("./pages/AdminUserStatistics"));
const AdminFraudAnalytics = lazy(() => import("./pages/AdminFraudAnalytics"));

// ============================================================================
// ARTISAN PAGES - Lazy load all artisan components
// ============================================================================
const ArtisanLayout = lazy(() => import("./layouts/ArtisanLayout"));
const ArtisanDashboard = lazy(() => import("./pages/ArtisanDashboard"));
const ArtisanProfile = lazy(() => import("./pages/ArtisanProfile"));
const ArtisanProfileEdit = lazy(() => import("./pages/ArtisanProfileEdit"));
const ArtisanSubscription = lazy(() => import("./pages/ArtisanSubscription"));
const ArtisanMarketplace = lazy(() => import("./pages/ArtisanMarketplace"));
const ArtisanPortfolio = lazy(() => import("./pages/ArtisanPortfolio"));
const ArtisanPortfolioAdd = lazy(() => import("./pages/ArtisanPortfolioAdd"));
const ArtisanProjects = lazy(() => import("./pages/ArtisanProjects"));
const ArtisanDevisCreate = lazy(() => import("./pages/ArtisanDevisCreate"));
const ArtisanFactures = lazy(() => import("./pages/ArtisanFactures"));
const ArtisanFactureStep1 = lazy(() => import("./pages/ArtisanFactureStep1"));
const ArtisanFactureStep2 = lazy(() => import("./pages/ArtisanFactureStep2"));
const ArtisanFactureStep3 = lazy(() => import("./pages/ArtisanFactureStep3"));
const ArtisanProductDetails = lazy(() => import("./pages/ArtisanProductDetails"));
const ArtisanOrderRequest = lazy(() => import("./pages/ArtisanOrderRequest"));
const ArtisanOrders = lazy(() => import("./pages/ArtisanOrders"));
const ArtisanCart = lazy(() => import("./pages/ArtisanCart"));
const ArtisanFavorites = lazy(() => import("./pages/ArtisanFavorites"));
const ArtisanWeather = lazy(() => import("./pages/ArtisanWeather"));
const ArtisanAvailability = lazy(() => import("./pages/ArtisanAvailability"));
const ArtisanServiceRequests = lazy(() => import("./pages/ArtisanServiceRequests"));

// ============================================================================
// PRESCRIPTEUR PAGES - Lazy load all prescripteur components
// ============================================================================
const PrescripteurLayout = lazy(() => import("./layouts/PrescripteurLayout"));
const PrescripteurProduits = lazy(() => import("./pages/PrescripteurProduits"));
const PrescripteurArtisans = lazy(() => import("./pages/PrescripteurArtisans"));
const PrescripteurProjects = lazy(() => import("./pages/PrescripteurProjects"));
const PrescripteurSearch = lazy(() => import("./pages/PrescripteurSearch"));
const ArtisanPublicProfile = lazy(() => import("./pages/ArtisanPublicProfile"));
const PrescripteurProductDetails = lazy(() => import("./pages/PrescripteurProductDetails"));
const PrescripteurServiceRequests = lazy(() => import("./pages/PrescripteurServiceRequests"));

// ============================================================================
// FOURNISSEUR PAGES - Lazy load all fournisseur components
// ============================================================================
const FournisseurLayout = lazy(() => import("./layouts/FournisseurLayout"));
const FournisseurDashboard = lazy(() => import("./pages/FournisseurDashboard"));
const FournisseurProduits = lazy(() => import("./pages/FournisseurProduits"));
const FournisseurProduitNew = lazy(() => import("./pages/FournisseurProduitNew"));
const FournisseurProduitEdit = lazy(() => import("./pages/FournisseurProduitEdit"));
const FournisseurOrders = lazy(() => import("./pages/FournisseurOrders"));
const FournisseurMarketplace = lazy(() => import("./pages/FournisseurMarketplace"));
const FournisseurProductDetails = lazy(() => import("./pages/FournisseurProductDetails"));

// ============================================================================
// SHARED PAGES - Lazy load shared components
// ============================================================================
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Messages = lazy(() => import("./pages/Messages"));
const Conversation = lazy(() => import("./pages/Conversation"));
const MyDisputes = lazy(() => import("./pages/MyDisputes"));
const Meetings = lazy(() => import("./pages/Meetings"));
const MLPredictionsPage = lazy(() => import("./pages/MLPredictions"));
const AiChat = lazy(() => import("./components/ai-chat"));

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
    return (
        <Suspense fallback={<PageLoader />}>
            <DarkModeProvider>
                <AppErrorBoundary>
                    <MouseTooltipProvider>
                        <BrowserRouter>
                            <Suspense fallback={null}>
                                <RealtimeNotifications />
                            </Suspense>
                            <Suspense fallback={null}>
                                <ArtisanLocationPromptModal />
                            </Suspense>
                            <Suspense fallback={null}>
                                <ReadPageButton />
                            </Suspense>
                            
                            <Routes>
                                {/* ============================================ */}
                                {/* PUBLIC ROUTES */}
                                {/* ============================================ */}
                                <Route path="/" element={<Navigate to="/login" replace />} />
                                
                                <Route path="/login" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <Login />
                                    </Suspense>
                                } />
                                
                                <Route path="/login-phone" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <PhoneLogin />
                                    </Suspense>
                                } />
                                
                                <Route path="/register-role" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <RegisterRole />
                                    </Suspense>
                                } />
                                
                                <Route path="/register-role-sms" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <RegisterRole />
                                    </Suspense>
                                } />
                                
                                <Route path="/forgot-password" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <ForgotPassword />
                                    </Suspense>
                                } />
                                
                                <Route path="/reset-password" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <ResetPassword />
                                    </Suspense>
                                } />
                                
                                <Route path="/verify-email" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <VerifyEmail />
                                    </Suspense>
                                } />
                                
                                <Route path="/unauthorized" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <Unauthorized />
                                    </Suspense>
                                } />
                                
                                <Route path="/profile" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <Profile />
                                    </Suspense>
                                } />
                                
                                <Route path="/accessibility-demo" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <AccessibilityDemo />
                                    </Suspense>
                                } />
                                
                                <Route path="/faceid-demo" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <FaceIdDemo />
                                    </Suspense>
                                } />

                                {/* Public Info Pages */}
                                <Route path="/about" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <About />
                                    </Suspense>
                                } />
                                
                                <Route path="/how-it-works" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <HowItWorks />
                                    </Suspense>
                                } />
                                
                                <Route path="/pricing" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <Pricing />
                                    </Suspense>
                                } />
                                
                                <Route path="/contact" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <Contact />
                                    </Suspense>
                                } />
                                
                                <Route path="/privacy" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <Privacy />
                                    </Suspense>
                                } />
                                
                                <Route path="/terms" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <Terms />
                                    </Suspense>
                                } />

                                {/* Register Routes */}
                                <Route path="/register" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <RegisterChooseRole />
                                    </Suspense>
                                } />
                                
                                <Route path="/register/:role" element={
                                    <Suspense fallback={<PageLoader />}>
                                        <RegisterForm />
                                    </Suspense>
                                } />

                                {/* Redirections */}
                                <Route path="/artisandeviscreate" element={<Navigate to="/artisan/devis/create" replace />} />
                                <Route path="/artisan/deviscreate" element={<Navigate to="/artisan/devis/create" replace />} />

                                {/* ============================================ */}
                                {/* ADMIN ROUTES (Protected) */}
                                {/* ============================================ */}
                                <Route element={
                                    <Suspense fallback={<PageLoader />}>
                                        <ProtectedRoute allowedRoles={[Roles.ADMIN]} />
                                    </Suspense>
                                }>
                                    <Route path="/admin" element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminLayout />
                                        </Suspense>
                                    }>
                                        <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
                                        <Route path="artisans" element={<Suspense fallback={<PageLoader />}><AdminArtisanDashboard /></Suspense>} />
                                        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
                                        <Route path="accessibility" element={<Suspense fallback={<PageLoader />}><AccessibilitySettings /></Suspense>} />
                                        <Route path="users" element={<Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>} />
                                        <Route path="activity" element={<Suspense fallback={<PageLoader />}><AdminActivityLogs /></Suspense>} />
                                        <Route path="transactions" element={<Suspense fallback={<PageLoader />}><AdminTransactions /></Suspense>} />
                                        <Route path="promo-codes" element={<Suspense fallback={<PageLoader />}><AdminPromoCodes /></Suspense>} />
                                        <Route path="reports" element={<Suspense fallback={<PageLoader />}><AdminReports /></Suspense>} />
                                        <Route path="disputes" element={<Suspense fallback={<PageLoader />}><AdminDisputes /></Suspense>} />
                                        <Route path="ai-insights" element={<Suspense fallback={<PageLoader />}><AdminAiInsights /></Suspense>} />
                                        <Route path="fraud-analytics" element={<Suspense fallback={<PageLoader />}><AdminFraudAnalytics /></Suspense>} />
                                        <Route path="user-statistics" element={<Suspense fallback={<PageLoader />}><AdminUserStatisticsPage /></Suspense>} />
                                        <Route path="AiChat" element={<Suspense fallback={<PageLoader />}><AiChat /></Suspense>} />
                                    </Route>
                                </Route>

                                {/* ============================================ */}
                                {/* ARTISAN ROUTES (Protected) */}
                                {/* ============================================ */}
                                <Route element={
                                    <Suspense fallback={<PageLoader />}>
                                        <ProtectedRoute allowedRoles={[Roles.ARTISAN]} />
                                    </Suspense>
                                }>
                                    <Route path="/artisan" element={
                                        <Suspense fallback={<PageLoader />}>
                                            <ArtisanLayout />
                                        </Suspense>
                                    }>
                                        <Route index element={<Suspense fallback={<PageLoader />}><ArtisanDashboard /></Suspense>} />
                                        <Route path="profile" element={<Suspense fallback={<PageLoader />}><ArtisanProfile /></Suspense>} />
                                        <Route path="accessibility" element={<Suspense fallback={<PageLoader />}><AccessibilitySettings /></Suspense>} />
                                        <Route path="profile/edit" element={<Suspense fallback={<PageLoader />}><ArtisanProfileEdit /></Suspense>} />
                                        <Route path="subscription" element={<Suspense fallback={<PageLoader />}><ArtisanSubscription /></Suspense>} />
                                        <Route path="marketplace" element={<Suspense fallback={<PageLoader />}><ArtisanMarketplace /></Suspense>} />
                                        <Route path="portfolio" element={<Suspense fallback={<PageLoader />}><ArtisanPortfolio /></Suspense>} />
                                        <Route path="portfolio/add" element={<Suspense fallback={<PageLoader />}><ArtisanPortfolioAdd /></Suspense>} />
                                        <Route path="portfolio/edit/:id" element={<Suspense fallback={<PageLoader />}><ArtisanPortfolioAdd /></Suspense>} />
                                        <Route path="projects" element={<Suspense fallback={<PageLoader />}><ArtisanProjects /></Suspense>} />
                                        <Route path="devis/create" element={<Suspense fallback={<PageLoader />}><ArtisanDevisCreate /></Suspense>} />
                                        <Route path="factures" element={<Suspense fallback={<PageLoader />}><ArtisanFactures /></Suspense>} />
                                        <Route path="factures/new" element={<Suspense fallback={<PageLoader />}><ArtisanFactureStep1 /></Suspense>} />
                                        <Route path="factures/new/step-2" element={<Suspense fallback={<PageLoader />}><ArtisanFactureStep2 /></Suspense>} />
                                        <Route path="factures/new/step-3" element={<Suspense fallback={<PageLoader />}><ArtisanFactureStep3 /></Suspense>} />
                                        <Route path="product/:id" element={<Suspense fallback={<PageLoader />}><ArtisanProductDetails /></Suspense>} />
                                        <Route path="order-request/:productId" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <RequireSubscription>
                                                    <ArtisanOrderRequest />
                                                </RequireSubscription>
                                            </Suspense>
                                        } />
                                        <Route path="orders" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <RequireSubscription>
                                                    <ArtisanOrders />
                                                </RequireSubscription>
                                            </Suspense>
                                        } />
                                        <Route path="orders/:id" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <RequireSubscription>
                                                    <OrderDetails />
                                                </RequireSubscription>
                                            </Suspense>
                                        } />
                                        <Route path="cart" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <RequireSubscription>
                                                    <ArtisanCart />
                                                </RequireSubscription>
                                            </Suspense>
                                        } />
                                        <Route path="favorites" element={<Suspense fallback={<PageLoader />}><ArtisanFavorites /></Suspense>} />
                                        <Route path="weather" element={<Suspense fallback={<PageLoader />}><ArtisanWeather /></Suspense>} />
                                        <Route path="availability" element={<Suspense fallback={<PageLoader />}><ArtisanAvailability /></Suspense>} />
                                        <Route path="service-requests" element={<Suspense fallback={<PageLoader />}><ArtisanServiceRequests /></Suspense>} />
                                        <Route path="disputes" element={<Suspense fallback={<PageLoader />}><MyDisputes /></Suspense>} />
                                        <Route path="meetings" element={<Suspense fallback={<PageLoader />}><Meetings /></Suspense>} />
                                        <Route path="ml-predictions" element={<Suspense fallback={<PageLoader />}><MLPredictionsPage /></Suspense>} />
                                        <Route path="messages" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <RequireSubscription>
                                                    <Messages />
                                                </RequireSubscription>
                                            </Suspense>
                                        } />
                                        <Route path="messages/:userId" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <RequireSubscription>
                                                    <Conversation />
                                                </RequireSubscription>
                                            </Suspense>
                                        } />
                                        <Route path="AiChat" element={<Suspense fallback={<PageLoader />}><AiChat /></Suspense>} />
                                    </Route>
                                </Route>

                                {/* ============================================ */}
                                {/* PRESCRIPTEUR ROUTES (Protected) */}
                                {/* ============================================ */}
                                <Route element={
                                    <Suspense fallback={<PageLoader />}>
                                        <ProtectedRoute allowedRoles={[Roles.PRESCRIPTEUR]} />
                                    </Suspense>
                                }>
                                    <Route path="/prescripteur" element={
                                        <Suspense fallback={<PageLoader />}>
                                            <PrescripteurLayout />
                                        </Suspense>
                                    }>
                                        <Route index element={<Suspense fallback={<PageLoader />}><PrescripteurProduits /></Suspense>} />
                                        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
                                        <Route path="accessibility" element={<Suspense fallback={<PageLoader />}><AccessibilitySettings /></Suspense>} />
                                        <Route path="search" element={<Suspense fallback={<PageLoader />}><PrescripteurSearch /></Suspense>} />
                                        <Route path="artisan/:id" element={<Suspense fallback={<PageLoader />}><ArtisanPublicProfile /></Suspense>} />
                                        <Route path="artisans" element={<Suspense fallback={<PageLoader />}><PrescripteurArtisans /></Suspense>} />
                                        <Route path="product/:id" element={<Suspense fallback={<PageLoader />}><PrescripteurProductDetails /></Suspense>} />
                                        <Route path="projects" element={<Suspense fallback={<PageLoader />}><PrescripteurProjects /></Suspense>} />
                                        <Route path="service-requests" element={<Suspense fallback={<PageLoader />}><PrescripteurServiceRequests /></Suspense>} />
                                        <Route path="disputes" element={<Suspense fallback={<PageLoader />}><MyDisputes /></Suspense>} />
                                        <Route path="meetings" element={<Suspense fallback={<PageLoader />}><Meetings /></Suspense>} />
                                        <Route path="ml-predictions" element={<Suspense fallback={<PageLoader />}><MLPredictionsPage /></Suspense>} />
                                        <Route path="messages" element={<Suspense fallback={<PageLoader />}><Messages /></Suspense>} />
                                        <Route path="messages/:userId" element={<Suspense fallback={<PageLoader />}><Conversation /></Suspense>} />
                                        <Route path="AiChat" element={<Suspense fallback={<PageLoader />}><AiChat /></Suspense>} />
                                    </Route>
                                </Route>

                                {/* ============================================ */}
                                {/* FOURNISSEUR ROUTES (Protected) */}
                                {/* ============================================ */}
                                <Route element={
                                    <Suspense fallback={<PageLoader />}>
                                        <ProtectedRoute allowedRoles={[Roles.SUPPLIER]} />
                                    </Suspense>
                                }>
                                    <Route path="/fournisseur" element={
                                        <Suspense fallback={<PageLoader />}>
                                            <FournisseurLayout />
                                        </Suspense>
                                    }>
                                        <Route index element={<Suspense fallback={<PageLoader />}><FournisseurDashboard /></Suspense>} />
                                        <Route path="produits" element={<Suspense fallback={<PageLoader />}><FournisseurProduits /></Suspense>} />
                                        <Route path="produits/new" element={<Suspense fallback={<PageLoader />}><FournisseurProduitNew /></Suspense>} />
                                        <Route path="produits/edit/:id" element={<Suspense fallback={<PageLoader />}><FournisseurProduitEdit /></Suspense>} />
                                        <Route path="marketplace" element={<Suspense fallback={<PageLoader />}><FournisseurMarketplace /></Suspense>} />
                                        <Route path="product/:id" element={<Suspense fallback={<PageLoader />}><FournisseurProductDetails /></Suspense>} />
                                        <Route path="orders" element={<Suspense fallback={<PageLoader />}><FournisseurOrders /></Suspense>} />
                                        <Route path="orders/:id" element={<Suspense fallback={<PageLoader />}><OrderDetails /></Suspense>} />
                                        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
                                        <Route path="accessibility" element={<Suspense fallback={<PageLoader />}><AccessibilitySettings /></Suspense>} />
                                        <Route path="messages" element={<Suspense fallback={<PageLoader />}><Messages /></Suspense>} />
                                        <Route path="messages/:userId" element={<Suspense fallback={<PageLoader />}><Conversation /></Suspense>} />
                                        <Route path="AiChat" element={<Suspense fallback={<PageLoader />}><AiChat /></Suspense>} />
                                    </Route>
                                </Route>

                                {/* Default Route */}
                                <Route path="*" element={<Navigate to="/login" replace />} />
                            </Routes>
                        </BrowserRouter>
                    </MouseTooltipProvider>
                </AppErrorBoundary>
            </DarkModeProvider>
        </Suspense>
    );
}
