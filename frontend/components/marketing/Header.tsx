"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const navigation = [
  { name: "Features", href: "/features" },
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
];

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/api/auth/login"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/api/auth/login"
              className="px-4 py-2 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-white/10">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <Link
                  href="/api/auth/login"
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/api/auth/login"
                  className="px-4 py-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-lg text-sm font-medium text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
