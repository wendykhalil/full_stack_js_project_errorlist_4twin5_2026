import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, History, LayoutDashboard, Shield, Sparkles, UserCircle2, Users, Tag, Flag, Briefcase } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import RoleWorkspace from "../components/RoleWorkspace";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { to: "/admin", label: "Vue d'ensemble", icon: <LayoutDashboard className="h-5 w-5" />, end: true },
    { to: "/admin/artisans", label: "Dashboard Artisans", icon: <Briefcase className="h-5 w-5" /> },
    { to: "/admin/users", label: "Utilisateurs", icon: <Users className="h-5 w-5" /> },
    { to: "/admin/fraud-analytics", label: "🚨📊 Fraud & Analytics", icon: <Shield className="h-5 w-5" /> },
    { to: "/admin/activity", label: "Activite", icon: <History className="h-5 w-5" /> },
    { to: "/admin/transactions", label: "Transactions", icon: <ArrowLeftRight className="h-5 w-5" /> },
    { to: "/admin/promo-codes", label: "Codes Promo", icon: <Tag className="h-5 w-5" /> },
    { to: "/admin/reports", label: "Signalements", icon: <Flag className="h-5 w-5" /> },
    { to: "/admin/ai-insights", label: "AI Insights", icon: <Sparkles className="h-5 w-5" /> },
  ];

  return (
    <RoleWorkspace
      role="ADMIN"
      roleLabel="Admin"
      user={user}
      navItems={navItems}
      footerMeta="Administrateur"
      avatar={<UserCircle2 className="h-10 w-10 text-slate-500 dark:text-slate-300" />}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
    />
  );
}
