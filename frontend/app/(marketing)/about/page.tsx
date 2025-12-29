import { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  Shield,
  Zap,
  Users,
  Target,
  Heart,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about TubeGrow - the AI-powered YouTube analytics platform helping creators grow their channels with actionable insights and data-driven strategies.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About TubeGrow | AI-Powered YouTube Growth",
    description:
      "Learn about TubeGrow - the AI-powered YouTube analytics platform helping creators grow their channels.",
  },
};

const values = [
  {
    icon: Target,
    title: "Creator-First",
    description:
      "Every feature we build is designed with creators in mind. Your success is our success.",
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description:
      "Your data is yours. We use industry-leading security practices to keep your information safe.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description:
      "We leverage cutting-edge AI to provide insights that were previously only available to large studios.",
  },
  {
    icon: Heart,
    title: "Community",
    description:
      "We're building more than a product - we're building a community of creators helping each other grow.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Empowering{" "}
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              YouTube Creators
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            We believe every creator deserves access to the same powerful analytics
            and AI tools that help top channels succeed. That's why we built TubeGrow.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-white">Our Mission</h2>
              <p className="text-gray-400 mb-4">
                YouTube has over 50 million creators, but most don't have access to
                the advanced analytics and AI tools that could help them grow faster.
              </p>
              <p className="text-gray-400 mb-4">
                TubeGrow changes that. We combine powerful YouTube analytics with
                cutting-edge AI to give every creator actionable insights that actually
                make a difference.
              </p>
              <p className="text-gray-400">
                From understanding why certain videos perform better, to generating
                Shorts clip ideas from long videos, to improving your SEO - we handle the
                data science so you can focus on creating.
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI-Powered Growth</h3>
                  <p className="text-sm text-gray-400">Smarter analytics for creators</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  Real-time channel analytics
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  AI-powered content optimization
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  Shorts moment discovery
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  SEO optimization tools
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-white">Our Values</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              These principles guide everything we do at TubeGrow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-400 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-white">Built by Creators, for Creators</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our team includes YouTube creators, data scientists, and engineers who
              understand the challenges of growing a channel firsthand.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Growing Team</p>
                <p className="text-gray-400 text-sm">Passionate about creator success</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Grow Your Channel?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Start free with 10 video analyses & 20 AI queries per month.
            No credit card required.
          </p>
          <Link
            href={`${process.env.NEXT_PUBLIC_API_URL || ""}/auth/login`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-semibold text-lg transition-all"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
