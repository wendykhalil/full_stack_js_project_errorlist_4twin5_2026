import React, { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import DashboardTopbar from "./DashboardTopbar";
import AccessibilityControls from "./AccessibilityControls";
import logo from "../assets/bmp-logo.svg";

function SidebarLink({ item, collapsed, onClick }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
          isActive
            ? "bg-white/20 text-white shadow-lg"
            : "text-blue-100 hover:bg-white/10 hover:text-white"
        } ${collapsed ? "justify-center px-2" : ""}`
      }
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </NavLink>
  );
}

function SectionLabel({ children, collapsed }) {
  if (collapsed) return null;
  return <div className="mb-2 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-blue-200">{children}</div>;
}

export default function RoleWorkspace({
  role,
  roleLabel,
  user,
  unreadCount = 0,
  navItems = [],
  footerMeta,
  avatar,
  onLogout,
  settingsItems = [],
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const mainItems = useMemo(() => navItems.slice(0, 6), [navItems]);
  const extraItems = useMemo(() => navItems.slice(6), [navItems]);

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className={`flex h-16 items-center border-b border-blue-700/50 ${isSidebarCollapsed ? "justify-center px-2" : "px-4"}`}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="BMP.tn" className="h-10 w-10 rounded-2xl bg-white p-1 shadow-sm" />
          {!isSidebarCollapsed ? (
            <div>
              <div className="text-base font-bold text-white">BMP.tn</div>
              <div className="text-[10px] font-medium text-blue-100">{roleLabel}</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Navigation - Hidden scrollbar */}
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <SectionLabel collapsed={isSidebarCollapsed}>Menu Principal</SectionLabel>
        <div className="space-y-1">
          {mainItems.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
          ))}
        </div>

        {extraItems.length ? (
          <>
            <SectionLabel collapsed={isSidebarCollapsed}>Plus</SectionLabel>
            <div className="space-y-1">
              {extraItems.map((item) => (
                <SidebarLink key={item.to} item={item} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
              ))}
            </div>
          </>
        ) : null}

        {settingsItems.length ? (
          <>
            <SectionLabel collapsed={isSidebarCollapsed}>Paramètres</SectionLabel>
            <div className="space-y-1">
              {settingsItems.map((item, index) => (
                <SidebarLink key={`${item.to}-${index}`} item={item} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
              ))}
            </div>
          </>
        ) : null}

        {!isSidebarCollapsed ? (
          <>
            <SectionLabel collapsed={isSidebarCollapsed}>Accessibility</SectionLabel>
            <AccessibilityControls />
          </>
        ) : null}
      </div>

      {/* User Section */}
      <div className="border-t border-blue-700/50 p-3 flex flex-col items-center gap-2">
        {/* Profile image and name */}
        {!isSidebarCollapsed && user && (
          <div className="flex flex-col items-center w-full mb-2">
            {avatar}
            <div className="mt-2 text-sm font-semibold text-white text-center">
              {user.firstName} {user.lastName}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-blue-200 transition-all duration-200 hover:bg-white/10 hover:text-white ${isSidebarCollapsed ? "justify-center" : ""}`}
        >
          <LogOut className="h-4 w-4" />
          {!isSidebarCollapsed ? <span>Déconnexion</span> : null}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar - Professional Blue Background */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-blue-800/30 bg-gradient-to-b from-blue-800 via-blue-700 to-blue-800 shadow-xl transition-all duration-300 xl:flex xl:flex-col ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((value) => !value)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-blue-300 bg-white text-blue-600 shadow-md transition-all hover:border-blue-400 hover:bg-blue-50"
          aria-label="Collapse sidebar"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className={`min-h-screen transition-all duration-300 ${isSidebarCollapsed ? "xl:ml-20" : "xl:ml-64"}`}>
        {/* Mobile Header - Sticky with Blue Color */}
        <header className="sticky top-0 z-20 border-b border-blue-800/30 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 backdrop-blur-md xl:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <img src={logo} alt="BMP.tn" className="h-9 w-9 rounded-2xl bg-white p-1 shadow-sm" />
              <div>
                <div className="text-sm font-bold text-white">BMP.tn</div>
                <div className="text-[10px] font-medium text-blue-100">{roleLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-full p-2 text-blue-200 transition-colors hover:bg-white/10 hover:text-white">
                <Bell className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                className="rounded-md p-2 text-blue-200 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Toggle sidebar"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Top Bar - BLUE COLOR */}
        <div className="sticky top-0 z-20 hidden xl:block">
          <DashboardTopbar role={role} unreadCount={unreadCount} />
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 z-40 xl:hidden ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
          <div
            className={`absolute inset-0 bg-slate-950/45 transition-opacity ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
            onClick={closeMobileMenu}
          />
          <div className={`absolute left-0 top-0 h-full w-[84%] max-w-[300px] bg-gradient-to-b from-blue-800 via-blue-700 to-blue-800 shadow-2xl transition-transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
            {sidebarContent}
          </div>
        </div>

        {/* Page Content */}
        <main className="w-full px-4 py-5 sm:px-5 xl:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}