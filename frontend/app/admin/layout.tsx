"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  DollarSign,
  History,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  AlertTriangle,
  Cpu,
  Mail,
} from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/lib/config";

interface ImpersonationInfo {
  is_impersonating: boolean;
  admin_name?: string;
  target_user_name?: string;
  target_user_email?: string;
  expires_at?: string;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/waitlist", label: "Waitlist", icon: Mail },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/api-costs", label: "API Costs", icon: Cpu },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/activity", label: "Activity Log", icon: History },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [impersonation, setImpersonation] = useState<ImpersonationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const res = await fetch(ADMIN_ENDPOINTS.STATUS, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Please authenticate first");
        } else if (res.status === 403) {
          setError("Admin access required");
        } else {
          setError("Failed to verify admin status");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.impersonation) {
        setImpersonation(data.impersonation);
      }
      setLoading(false);
    } catch {
      setError("Failed to connect to server");
      setLoading(false);
    }
  };

  const handleEndImpersonation = async () => {
    try {
      const res = await fetch(ADMIN_ENDPOINTS.IMPERSONATE_END, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setImpersonation(null);
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to end impersonation:", err);
    }
  };

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-xl mb-2">{error}</p>
          <Link href="/" className="text-purple-400 hover:underline">
            Go back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Impersonation Banner */}
      {impersonation?.is_impersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span>
              <strong>{impersonation.admin_name}</strong> is impersonating{" "}
              <strong>{impersonation.target_user_name}</strong> ({impersonation.target_user_email})
            </span>
          </div>
          <button
            onClick={handleEndImpersonation}
            className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
            End Session
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } border-r border-white/10 bg-black/50 backdrop-blur-xl transition-all duration-300 flex flex-col ${
          impersonation?.is_impersonating ? "pt-12" : ""
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-lg">Admin Panel</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                    : "hover:bg-white/10 text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Back to App */}
        <div className="p-2 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Back to App</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 overflow-auto ${
          impersonation?.is_impersonating ? "pt-12" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
