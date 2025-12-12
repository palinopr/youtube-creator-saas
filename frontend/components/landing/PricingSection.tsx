import { Check } from "lucide-react";
import { AUTH_ENDPOINTS } from "@/lib/config";

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Get started with basic analytics",
    price: "$0",
    cadence: "/mo",
    features: ["10 video analyses/month", "20 AI queries/month", "Basic channel stats", "Community support"],
    cta: "Start free",
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    description: "For growing creators",
    price: "$19",
    cadence: "/mo",
    features: ["50 video analyses/month", "100 AI queries/month", "10 viral clips/month", "SEO optimization", "Transcript analysis"],
    cta: "Start starter",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For serious content creators",
    price: "$49",
    cadence: "/mo",
    features: ["Unlimited video analyses", "500 AI queries/month", "50 viral clips/month", "Deep analysis + causal analytics", "Export reports", "Priority support"],
    cta: "Start pro",
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    description: "For teams and agencies",
    price: "$149",
    cadence: "/mo",
    features: ["Everything in Pro", "Unlimited AI queries", "Unlimited viral clips", "API access", "Dedicated support"],
    cta: "Contact sales",
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
            Plans
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
            Choose the right plan for you
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Start on Free. Upgrade anytime when you’re ready.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`landing-card p-8 relative ${
                plan.popular ? "pricing-popular" : ""
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-white/50 text-sm">{plan.description}</p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/50">{plan.cadence}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check
                      size={18}
                      className={`flex-shrink-0 mt-0.5 ${
                        plan.popular ? "text-brand-500" : "text-white/40"
                      }`}
                    />
                    <span className="text-white/70 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.id === "agency" ? (
                <a
                  href="mailto:sales@tubegrow.io"
                  className={`block w-full text-center py-3 rounded-full font-semibold transition-all ${
                    plan.popular
                      ? "btn-cta-primary"
                      : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <a
                  href={AUTH_ENDPOINTS.LOGIN}
                  className={`block w-full text-center py-3 rounded-full font-semibold transition-all ${
                    plan.popular
                      ? "btn-cta-primary"
                      : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Trust note */}
        <p className="text-center text-white/40 text-sm mt-8">
          No credit card required for Free. Cancel anytime on paid plans.
        </p>
      </div>
    </section>
  );
}
