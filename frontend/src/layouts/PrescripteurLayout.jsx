import React from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, MessageCircle, PackageSearch, Search, Shield, UserCircle2, Users } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import RoleWorkspace from "../components/RoleWorkspace";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

export default function PrescripteurLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const unreadCount = useUnreadMessages();

  const messageIcon = (
    <span className="relative inline-flex">
      <MessageCircle className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-2 -top-2 min-w-[1rem] rounded-full bg-red-500 px-1 text-[10px] text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </span>
  );

  const navItems = [
    { to: "/prescripteur", label: "Produits", icon: <PackageSearch className="h-5 w-5" />, end: true },
    { to: "/prescripteur/artisans", label: "Artisans", icon: <Users className="h-5 w-5" /> },
    { to: "/prescripteur/projects", label: "Projets", icon: <FolderKanban className="h-5 w-5" /> },
    { to: "/prescripteur/search", label: "Rechercher", icon: <Search className="h-5 w-5" /> },
    { to: "/prescripteur/profile", label: "Profil", icon: <UserCircle2 className="h-5 w-5" /> },
    { to: "/prescripteur/messages", label: "Messages", icon: messageIcon },
  ];

  const settingsItems = [
    { to: "/prescripteur/profile", label: "Profile", icon: <UserCircle2 className="h-4 w-4" /> },
    { to: "/prescripteur/profile", label: "Reset password", icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <RoleWorkspace
      role="PRESCRIPTEUR"
      roleLabel="Prescripteur"
      user={user}
      unreadCount={unreadCount}
      navItems={navItems}
      footerMeta="Prescripteur"
      settingsItems={settingsItems}
      avatar={<UserCircle2 className="h-10 w-10 text-slate-500 dark:text-slate-300" />}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
    />
  );
}
