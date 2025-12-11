"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, User, Shield, CreditCard, FileText } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const settingsNav: NavItem[] = [
  { href: "/settings", label: "Overview", icon: Settings },
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/account", label: "Account", icon: Shield },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings/billing/history", label: "Invoices", icon: FileText },
];

export default function SettingsNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/settings") {
      return pathname === "/settings";
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <nav className="flex flex-wrap gap-2 mb-8">
      {settingsNav.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent"
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
