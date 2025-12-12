import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how TubeGrow collects, uses, and protects your information when you use our AI-powered YouTube analytics platform.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | TubeGrow",
    description:
      "TubeGrow's privacy policy explains what data we collect and how we use it to provide YouTube analytics and growth tools.",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-black to-black" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-lg">
            This policy describes how TubeGrow collects, uses, and safeguards
            information. If you have questions, contact us at{" "}
            <a href="mailto:support@tubegrow.io" className="text-emerald-400 hover:underline">
              support@tubegrow.io
            </a>
            .
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-invert prose-lg prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300">
        <h2>What we collect</h2>
        <p>
          When you create an account or connect a YouTube channel, we may collect
          basic account details (like email), channel identifiers, and analytics
          data available through the YouTube API. We also collect usage data such
          as pages visited, features used, and performance metrics to improve the
          product.
        </p>

        <h2>How we use data</h2>
        <p>
          We use your data to provide TubeGrow’s core services: analytics
          dashboards, SEO recommendations, AI insights, and clip detection. We
          also use aggregated, anonymized data to improve our models and to
          understand product performance. We do not sell your personal data.
        </p>

        <h2>Cookies and tracking</h2>
        <p>
          TubeGrow uses cookies and similar technologies to keep you signed in,
          remember preferences, and measure site performance. You can control
          cookies in your browser settings, but some features may not work
          properly without them.
        </p>

        <h2>Third‑party services</h2>
        <p>
          We rely on trusted third parties such as hosting providers, analytics
          tools, and the YouTube API. These services process data only as needed
          to support TubeGrow. Where applicable, their processing is governed by
          their own privacy policies.
        </p>

        <h2>Data retention</h2>
        <p>
          We retain your information only as long as necessary to provide the
          service, meet legal obligations, and resolve disputes. You can request
          deletion of your account and associated data by emailing support.
        </p>

        <h2>Security</h2>
        <p>
          We use industry‑standard security practices, including encryption in
          transit and access controls, to protect your data. No method of
          transmission is 100% secure, but we work hard to keep your information
          safe.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Access or update account information in Settings.</li>
          <li>Disconnect your YouTube channel at any time.</li>
          <li>Request export or deletion of your data.</li>
        </ul>

        <h2>Updates to this policy</h2>
        <p>
          We may update this policy as TubeGrow evolves. We’ll post changes here
          and update the “last updated” date. Continued use of the service after
          changes means you accept the updated policy.
        </p>

        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString("en-US")}
        </p>

        <p>
          Back to{" "}
          <Link href="/" className="text-emerald-400 hover:underline">
            TubeGrow
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
