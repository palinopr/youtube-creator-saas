"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Youtube,
  Home,
  Video,
  Scissors,
  Zap,
  BarChart3,
  TrendingUp,
  Sparkles,
  LogOut,
  Shield,
  Search,
  Settings,
  User,
  ChevronUp,
  Users,
  Globe,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/lib/config";
import { api } from "@/lib/api";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  color?: "default" | "purple" | "pink" | "emerald" | "blue";
}

function NavItem({ icon, label, href, active = false, color = "default" }: NavItemProps) {
  const colorClasses: Record<string, string> = {
    default: active
      ? "text-white bg-white/10"
      : "text-gray-400 hover:text-white hover:bg-white/5",
    purple: "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10",
    pink: "text-pink-400 hover:text-pink-300 hover:bg-pink-500/10",
    emerald: "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10",
    blue: "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10",
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        colorClasses[color] || colorClasses.default
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      {label}
    </Link>
  );
}

interface SidebarProps {
  /** Override active path detection (optional) */
  activePath?: string;
}

interface UserProfile {
  name: string | null;
  email: string;
  avatar_url: string | null;
}

export default function Sidebar({ activePath }: SidebarProps) {
  const pathname = usePathname();
  const currentPath = activePath || pathname;
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [subscription, setSubscription] = useState<{plan_id: string} | null>(null);
  const [primaryChannel, setPrimaryChannel] = useState<{title: string; thumbnail: string} | null>(null);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const res = await fetch(ADMIN_ENDPOINTS.STATUS, {
          credentials: "include",
        });
        if (res.ok) {
          setIsAdmin(true);
        }
      } catch {
        // Not admin or not authenticated
      }
    };
    checkAdmin();

    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const data: any = await api.getProfile();
        setUserProfile(data);
        if (data.channels && data.channels.length > 0) {
          setPrimaryChannel({
            title: data.channels[0].title,
            thumbnail: data.channels[0].thumbnail_url,
          });
        }
      } catch {
        // Failed to fetch profile
      }
    };
    fetchProfile();

    // Fetch subscription
    const fetchSubscription = async () => {
      try {
        const data: any = await api.getSubscription();
        setSubscription(data);
      } catch {
        // No subscription or not authenticated
      }
    };
    fetchSubscription();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore logout failures
    }
    window.location.href = "/";
  };

  // Determine which nav item is active
  const isActive = (href: string) => {
    if (href === "/command-center") return currentPath === "/command-center";
    return currentPath.startsWith(href);
  };

  return (
    <aside className="w-64 bg-[#111] border-r border-white/10 flex-shrink-0 hidden lg:flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/command-center" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Youtube className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">CreatorSaaS</h1>
            <p className="text-xs text-gray-500">YouTube Analytics</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
        <NavItem
          icon={<Home />}
          label="Command Center"
          href="/command-center"
          active={isActive("/command-center")}
        />
        <NavItem
          icon={<Video />}
          label="Videos"
          href="/videos"
          active={isActive("/videos") || isActive("/video")}
        />

        <div className="pt-4 pb-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider px-3">
            Tools
          </p>
        </div>

        <NavItem
          icon={<Scissors />}
          label="Clips"
          href="/clips"
          color="pink"
          active={isActive("/clips")}
        />
        <NavItem
          icon={<Zap />}
          label="Content Ideas"
          href="/optimize"
          color="purple"
          active={isActive("/optimize")}
        />

        <div className="pt-4 pb-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider px-3">
            Analytics
          </p>
        </div>

        <NavItem
          icon={<BarChart3 />}
          label="Channel Analysis"
          href="/analysis"
          active={isActive("/analysis")}
        />
        <NavItem
          icon={<Users />}
          label="Audience"
          href="/audience"
          active={isActive("/audience")}
        />
        <NavItem
          icon={<Globe />}
          label="Traffic Sources"
          href="/traffic"
          active={isActive("/traffic")}
        />
        <NavItem
          icon={<DollarSign />}
          label="Revenue"
          href="/revenue"
          color="emerald"
          active={isActive("/revenue")}
        />
        <NavItem
          icon={<TrendingUp />}
          label="Deep Analysis"
          href="/deep-analysis"
          active={isActive("/deep-analysis")}
        />

        <div className="pt-4 pb-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider px-3">
            Engagement
          </p>
        </div>

        <NavItem
          icon={<MessageSquare />}
          label="Comments"
          href="/comments"
          color="blue"
          active={isActive("/comments")}
        />
        <NavItem
          icon={<Sparkles />}
          label="AI Insights"
          href="/advanced-insights"
          active={isActive("/advanced-insights")}
        />

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-600 uppercase tracking-wider px-3">
                Admin
              </p>
            </div>

            <NavItem
              icon={<Search />}
              label="SEO Rankings"
              href="/admin/seo"
              color="emerald"
              active={isActive("/admin/seo")}
            />
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-white/10 relative">
        {/* Dropdown Menu - Opens Upward */}
        {userMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
            <Link
              href="/settings"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </Link>
            <Link
              href="/settings/profile"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">Profile</span>
            </Link>
            <div className="border-t border-white/10" />
            <button
              onClick={() => {
                setUserMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Log out</span>
            </button>
          </div>
        )}

        {/* User Box: Avatar + Channel Name + Plan */}
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          {/* Avatar */}
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt="Profile"
              className="w-9 h-9 rounded-full border border-white/20"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
              {primaryChannel?.title?.charAt(0) || userProfile?.name?.charAt(0) || "U"}
            </div>
          )}

          {/* Channel Name + Plan Badge */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white truncate">
                {primaryChannel?.title || userProfile?.name || "My Channel"}
              </p>
              {/* Plan Badge */}
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                subscription?.plan_id === 'pro'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {subscription?.plan_id === 'pro' ? 'PRO' : 'FREE'}
              </span>
            </div>
          </div>

          {/* Chevron */}
          <ChevronUp className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${userMenuOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  );
}
