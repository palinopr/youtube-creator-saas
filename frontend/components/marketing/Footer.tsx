import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const footerLinks = {
  product: [
    { name: "Features", href: "/features" },
    { name: "YouTube Analytics Tool", href: "/youtube-analytics-tool" },
    { name: "YouTube SEO Tool", href: "/youtube-seo-tool" },
    { name: "Niches", href: "/niches" },
    { name: "AI Tools", href: "/ai-youtube-tools" },
    { name: "Viral Clips", href: "/viral-clips-generator" },
    { name: "Blog", href: "/blog" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "mailto:support@tubegrow.io" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
  social: [
    { name: "Twitter", href: "https://twitter.com/tubegrow" },
    { name: "YouTube", href: "https://youtube.com/@tubegrow" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="md" linkToHome={true} className="mb-4" />
            <p className="text-sm text-gray-400 max-w-xs">
              AI-powered YouTube analytics to help creators grow their channels faster with actionable insights.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith("mailto:") ? (
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} TubeGrow. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {footerLinks.social.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
