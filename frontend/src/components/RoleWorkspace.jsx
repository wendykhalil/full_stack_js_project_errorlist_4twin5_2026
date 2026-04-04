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
        `flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
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
  return <div className="mb-2 mt-4 px-3 text-xs font-medium text-slate-400">{children}</div>;
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
      <div className={`flex h-16 items-center border-b border-slate-200 ${isSidebarCollapsed ? "justify-center px-2" : "px-4"} dark:border-slate-800`}>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
            <img src={logo} alt="BMP.tn" className="h-4 w-4 brightness-0 invert" />
          </span>
          {!isSidebarCollapsed ? (
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">BMP.tn</div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <SectionLabel collapsed={isSidebarCollapsed}>Dashboard</SectionLabel>
        <div className="space-y-1">
          {mainItems.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
          ))}
        </div>

        {extraItems.length ? (
          <>
            <SectionLabel collapsed={isSidebarCollapsed}>More</SectionLabel>
            <div className="space-y-1">
              {extraItems.map((item) => (
                <SidebarLink key={item.to} item={item} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
              ))}
            </div>
          </>
        ) : null}

        {settingsItems.length ? (
          <>
            <SectionLabel collapsed={isSidebarCollapsed}>Settings</SectionLabel>
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

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <button
          type="button"
          onClick={onLogout}
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-[13px] text-slate-500 transition hover:bg-slate-100 hover:text-red-600 dark:text-slate-300 dark:hover:bg-slate-800 ${isSidebarCollapsed ? "justify-center" : ""}`}
        >
          <LogOut className="h-4 w-4" />
          {!isSidebarCollapsed ? <span>Logout</span> : null}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#eef3fb] dark:bg-slate-950">
      {/* Sidebar - Fixed on left */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-all duration-300 xl:flex xl:flex-col dark:border-slate-800 dark:bg-slate-900 ${
          isSidebarCollapsed ? "w-20" : "w-60"
        }`}
      >
        {sidebarContent}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((value) => !value)}
          className="absolute bottom-4 right-4 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Collapse sidebar"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className={`min-h-screen transition-all duration-300 ${isSidebarCollapsed ? "xl:ml-20" : "xl:ml-60"}`}>
        {/* Mobile Header - Sticky */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white xl:hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                <img src={logo} alt="BMP.tn" className="h-4 w-4 brightness-0 invert" />
              </span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">BMP.tn</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <Bell className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Toggle sidebar"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Top Bar - STICKY FIXED */}
        <div className="sticky top-0 z-20 hidden xl:block">
          <DashboardTopbar role={role} unreadCount={unreadCount} />
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 z-40 xl:hidden ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
          <div
            className={`absolute inset-0 bg-slate-950/45 transition-opacity ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
            onClick={closeMobileMenu}
          />
          <div className={`absolute left-0 top-0 h-full w-[84%] max-w-[300px] bg-white shadow-2xl transition-transform dark:bg-slate-900 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
            {sidebarContent}
          </div>
        </div>

        {/* Page Content */}
        <main className="px-4 py-5 sm:px-5 xl:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}