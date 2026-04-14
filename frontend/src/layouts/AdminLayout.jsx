import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, History, LayoutDashboard, Shield, UserCircle2, Users, Tag } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import RoleWorkspace from "../components/RoleWorkspace";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { to: "/admin/profile", label: "Profil", icon: <UserCircle2 className="h-5 w-5" /> },
    { to: "/admin", label: "Vue d'ensemble", icon: <LayoutDashboard className="h-5 w-5" />, end: true },
    { to: "/admin/users", label: "Utilisateurs", icon: <Users className="h-5 w-5" /> },
    { to: "/admin/activity", label: "Activite", icon: <History className="h-5 w-5" /> },
    { to: "/admin/transactions", label: "Transactions", icon: <ArrowLeftRight className="h-5 w-5" /> },
    { to: "/admin/promo-codes", label: "Codes Promo", icon: <Tag className="h-5 w-5" /> },
  ];

  const settingsItems = [
    { to: "/admin/profile", label: "Profil", icon: <UserCircle2 className="h-4 w-4" /> },
    { to: "/admin/profile", label: "Reinitialiser le mot de passe", icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <RoleWorkspace
      role="ADMIN"
      roleLabel="Admin"
      user={user}
      navItems={navItems}
      footerMeta="Administrateur"
      settingsItems={settingsItems}
      avatar={<UserCircle2 className="h-10 w-10 text-slate-500 dark:text-slate-300" />}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
    />
  );
}
