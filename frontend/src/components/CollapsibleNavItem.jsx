import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";

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

export default function CollapsibleNavItem({ 
  title, 
  icon, 
  items = [], 
  collapsed, 
  onClick 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (collapsed) {
    // When sidebar is collapsed, show as a regular item that expands on hover
    return (
      <div className="relative group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title={title}
          className="flex items-center justify-center w-full rounded-xl px-2 py-2.5 text-[13px] font-medium text-blue-100 transition-all duration-200 hover:bg-white/10 hover:text-white"
        >
          <span className="flex-shrink-0">{icon}</span>
        </button>
        
        {/* Hover tooltip with submenu */}
        <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
          <div className="rounded-xl border border-blue-700/50 bg-gradient-to-b from-blue-800 via-blue-700 to-blue-800 shadow-xl min-w-[200px]">
            <div className="px-3 py-2 border-b border-blue-700/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                {title}
              </span>
            </div>
            <div className="p-2 space-y-1">
              {items.map((item) => (
                <SidebarLink 
                  key={item.to} 
                  item={item} 
                  collapsed={false} 
                  onClick={onClick} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-[13px] font-medium text-blue-100 transition-all duration-200 hover:bg-white/10 hover:text-white"
      >
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 transition-transform" />
        ) : (
          <ChevronRight className="h-4 w-4 transition-transform" />
        )}
      </button>
      
      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1 border-l border-blue-700/30 pl-3">
          {items.map((item) => (
            <SidebarLink 
              key={item.to} 
              item={item} 
              collapsed={false} 
              onClick={onClick} 
            />
          ))}
        </div>
      )}
    </div>
  );
}