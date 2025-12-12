import { ShieldCheck, LockKeyhole, Eye, Cpu } from "lucide-react";

const items = [
  {
    title: "Secure OAuth",
    description:
      "Connect via Google OAuth. TubeGrow never uploads or posts content automatically.",
    icon: ShieldCheck,
  },
  {
    title: "Encrypted tokens",
    description: "OAuth tokens are encrypted at rest and sent over HTTPS.",
    icon: LockKeyhole,
  },
  {
    title: "Official APIs",
    description: "Built on YouTube Data + Analytics APIs for reliable metrics.",
    icon: Cpu,
  },
  {
    title: "You control changes",
    description:
      "If you choose to update SEO metadata, it only happens when you click apply.",
    icon: Eye,
  },
];

export default function SocialProofSection() {
  return (
    <section className="py-16 border-y border-white/5">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
            Trust
          </p>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
            Built to be secure and compliant
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Your channel stays yours. TubeGrow connects via Google OAuth and analyzes your data—read-only.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="landing-card p-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-500" />
                </div>
                <div className="text-white font-semibold mb-2">{item.title}</div>
                <div className="text-white/60 text-sm leading-relaxed">{item.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
