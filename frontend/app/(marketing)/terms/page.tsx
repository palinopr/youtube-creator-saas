import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "TubeGrow terms of service governing use of our AI-powered YouTube analytics and growth platform.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | TubeGrow",
    description:
      "Read the terms that apply when using TubeGrow to analyze and optimize your YouTube channel.",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-black" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-400 text-lg">
            These terms govern your use of TubeGrow. By accessing or using the
            service, you agree to them. If you don’t agree, please don’t use the
            product.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-invert prose-lg prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300">
        <h2>Use of the service</h2>
        <p>
          TubeGrow provides analytics, SEO recommendations, AI insights, and
          clip generation tools for YouTube creators. You are responsible for
          how you use these tools and for ensuring your content complies with
          YouTube’s policies and applicable laws.
        </p>

        <h2>Accounts</h2>
        <p>
          You must provide accurate information when creating an account and
          keep your credentials secure. You are responsible for all activity
          under your account. If you believe your account has been compromised,
          contact support immediately.
        </p>

        <h2>Subscriptions and billing</h2>
        <p>
          Paid plans renew automatically unless canceled. You can manage or
          cancel your subscription in Settings. Fees are non‑refundable except
          where required by law. We may change pricing with reasonable notice.
        </p>

        <h2>Acceptable use</h2>
        <ul>
          <li>Do not attempt to reverse engineer or disrupt the service.</li>
          <li>Do not use TubeGrow for unlawful or abusive activities.</li>
          <li>Do not scrape or mass‑download data beyond normal use.</li>
        </ul>

        <h2>Intellectual property</h2>
        <p>
          TubeGrow and its software are owned by TubeGrow. We grant you a limited,
          non‑exclusive license to use the service while your account is active.
          Your content and channel data remain yours.
        </p>

        <h2>Disclaimer and limitation of liability</h2>
        <p>
          TubeGrow is provided “as is.” We don’t guarantee specific results,
          rankings, or growth. To the maximum extent permitted by law, TubeGrow
          will not be liable for indirect or consequential damages.
        </p>

        <h2>Termination</h2>
        <p>
          You can stop using TubeGrow at any time. We may suspend or terminate
          accounts for violations of these terms. Upon termination, your access
          to paid features ends and your data may be deleted per our privacy
          policy.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms as the product evolves. We’ll post changes
          here and update the “last updated” date. Continued use after changes
          indicates acceptance.
        </p>

        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString("en-US")}
        </p>

        <p>
          Questions? Email{" "}
          <a href="mailto:support@tubegrow.io" className="text-blue-400 hover:underline">
            support@tubegrow.io
          </a>{" "}
          or return to{" "}
          <Link href="/" className="text-blue-400 hover:underline">
            TubeGrow
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
