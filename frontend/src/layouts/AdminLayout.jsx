import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Bell, LayoutDashboard, Users, ArrowLeftRight,
  UserCircle2, LogOut, History, Menu, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";

const Tab = ({ to, icon, label, onClick, collapsed }) => (
  <NavLink
    to={to}
    end
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
        isActive
          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100"
      } ${collapsed ? "justify-center" : ""}`
    }
    title={collapsed ? label : undefined}
  >
    <span className="flex-shrink-0">{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Custom breakpoints
  const SIDEBAR_ICON_ONLY_WIDTH = 1477; // At 1477px, show only icons
  const HAMBURGER_WIDTH = 1267; // At 1267px, show hamburger menu

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    // Set initial width
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-collapse sidebar when width is below or equal to 1477px
  useEffect(() => {
    if (windowWidth <= SIDEBAR_ICON_ONLY_WIDTH && windowWidth > HAMBURGER_WIDTH) {
      setIsSidebarCollapsed(true);
    } else if (windowWidth > SIDEBAR_ICON_ONLY_WIDTH) {
      setIsSidebarCollapsed(false);
    }
  }, [windowWidth]);

  // Determine if we should show desktop sidebar or mobile menu
  const showDesktopSidebar = windowWidth > HAMBURGER_WIDTH;
  const showMobileMenu = windowWidth <= HAMBURGER_WIDTH;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Desktop Sidebar - Visible when width > 1267px */}
      {showDesktopSidebar && (
        <aside 
          className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 transition-all duration-300 z-30 dark:bg-slate-800 dark:border-slate-700 ${
            isSidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Logo */}
          <div className={`flex items-center h-20 border-b border-slate-200 dark:border-slate-700 ${isSidebarCollapsed ? "justify-center" : "px-5"}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">BMP.tn</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Admin</div>
                </div>
              )}
            </div>
          </div>

          {/* Nav links */}
          <div className="flex-1 overflow-y-auto py-6 px-3">
            <div className="space-y-1">
              <Tab to="/admin" icon={<LayoutDashboard className="h-5 w-5" />} label="Vue d'ensemble" collapsed={isSidebarCollapsed} />
              <Tab to="/admin/users" icon={<Users className="h-5 w-5" />} label="Utilisateurs" collapsed={isSidebarCollapsed} />
              <Tab to="/admin/logs" icon={<History className="h-5 w-5" />} label="Logs" collapsed={isSidebarCollapsed} />
              <Tab to="/admin/transactions" icon={<ArrowLeftRight className="h-5 w-5" />} label="Transactions" collapsed={isSidebarCollapsed} />
            </div>
          </div>

          {/* User section */}
          <div className={`border-t border-slate-200 dark:border-slate-700 p-3 ${isSidebarCollapsed ? "text-center" : ""}`}>
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? "justify-center" : ""} mb-3`}>
              <UserCircle2 className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Admin"}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Administrateur</div>
                </div>
              )}
            </div>
            <button
              onClick={() => { logout(); navigate("/login", { replace: true }); }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 ${isSidebarCollapsed ? "justify-center" : ""}`}
              title={isSidebarCollapsed ? "Déconnexion" : undefined}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Déconnexion</span>}
            </button>
          </div>

          {/* Collapse toggle - Only visible when width > 1477px */}
          {windowWidth > SIDEBAR_ICON_ONLY_WIDTH && (
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </aside>
      )}

      {/* Main content - Adjust margin based on sidebar state */}
      <main className={`flex-1 flex flex-col h-full transition-all duration-300 w-full ${
        showDesktopSidebar ? (isSidebarCollapsed ? "ml-20" : "ml-64") : "ml-0"
      }`}>
        {/* Header - Visible on all screens */}
        <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
            {/* Left side - Logo only */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {/* Show logo icon on mobile when sidebar is hidden */}
                {showMobileMenu && (
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                    <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                )}
                <div>
                  <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">BMP.tn</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 hidden xs:block">Admin</div>
                </div>
              </div>
            </div>

            {/* Right side - Actions with hamburger menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <button className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500" />
              </button>
              
              {/* Hamburger menu button - Visible when width <= 1267px */}
              {showMobileMenu && (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar overlay - Only visible when mobile menu is open */}
        {showMobileMenu && (
          <div 
            className={`fixed inset-0 z-30 transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Backdrop */}
            <div 
              className={`absolute inset-0 bg-black/50 transition-opacity ${
                isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`} 
              onClick={closeMobileMenu} 
            />
            
            {/* Sidebar - Positioned on the right */}
            <div className="absolute right-0 top-0 h-full w-64 sm:w-72 bg-white shadow-xl dark:bg-slate-800">
              <div className="flex h-full flex-col">
                {/* Mobile sidebar header */}
                <div className="border-b border-slate-200 dark:border-slate-700 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <UserCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[180px]">
                          {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Admin"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Administrateur</div>
                      </div>
                    </div>
                    <button 
                      onClick={closeMobileMenu}
                      className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <X className="h-5 w-5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Mobile navigation */}
                <div className="flex-1 overflow-y-auto py-4 px-3">
                  <div className="space-y-1">
                    <Tab to="/admin" icon={<LayoutDashboard className="h-5 w-5" />} label="Vue d'ensemble" onClick={closeMobileMenu} collapsed={false} />
                    <Tab to="/admin/users" icon={<Users className="h-5 w-5" />} label="Utilisateurs" onClick={closeMobileMenu} collapsed={false} />
                    <Tab to="/admin/logs" icon={<History className="h-5 w-5" />} label="Logs" onClick={closeMobileMenu} collapsed={false} />
                    <Tab to="/admin/transactions" icon={<ArrowLeftRight className="h-5 w-5" />} label="Transactions" onClick={closeMobileMenu} collapsed={false} />
                  </div>
                </div>

                {/* Mobile logout */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-3">
                  <button
                    onClick={() => { logout(); navigate("/login", { replace: true }); closeMobileMenu(); }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <LogOut className="h-5 w-5" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Area - with responsive padding */}
        <div className="flex-1 w-full overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}