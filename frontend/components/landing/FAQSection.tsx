"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqCategories = [
  {
    id: "general",
    label: "General",
    questions: [
      {
        question: "What is TubeGrow?",
        answer:
          "TubeGrow is an AI-powered analytics and optimization platform designed specifically for YouTube creators. We help you understand your channel performance, optimize your content for search, identify viral opportunities, and grow your audience faster.",
      },
      {
        question: "How does the AI analyze my channel?",
        answer:
          "Our AI analyzes multiple data points including video performance metrics, thumbnail effectiveness, title optimization, description SEO, audience retention patterns, and engagement rates. It then provides personalized recommendations based on what's working in your niche.",
      },
      {
        question: "Is my YouTube data secure?",
        answer:
          "Absolutely. We use OAuth 2.0 for secure authentication and only request read-only access to your channel data. We never post on your behalf or access private messages. Your data is encrypted at rest and in transit.",
      },
    ],
  },
  {
    id: "access",
    label: "Access",
    questions: [
      {
        question: "How do I get access to TubeGrow?",
        answer:
          "TubeGrow is currently in waitlist-only early access. Join the waitlist on the homepage, and we’ll invite creators in waves as we open the beta.",
      },
      {
        question: "When will pricing be available?",
        answer:
          "We’ll share pricing when the public beta opens. Waitlist members will get early access and first notice of launch details.",
      },
      {
        question: "Will TubeGrow have a free plan?",
        answer:
          "We’re finalizing launch plans now. The waitlist is the best way to get early access and learn what’s included at launch.",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    questions: [
      {
        question: "Can I connect multiple YouTube channels?",
        answer:
          "Yes. TubeGrow supports multiple channels per account. Limits (if any) will be announced during beta as we scale access.",
      },
      {
        question: "How do I connect my channel?",
        answer:
          "Once you’re invited to the beta, you connect through secure Google OAuth in one click. TubeGrow only requests the permissions needed to read your analytics and optimize your content.",
      },
      {
        question: "Can I export my data?",
        answer:
          "Yes. You can export analytics and insights from your dashboard. We’re expanding export formats as we roll out the beta.",
      },
    ],
  },
];

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState("general");
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);

  const toggleQuestion = (question: string) => {
    setOpenQuestions((prev) =>
      prev.includes(question)
        ? prev.filter((q) => q !== question)
        : [...prev, question]
    );
  };

  const activeQuestions =
    faqCategories.find((c) => c.id === activeCategory)?.questions || [];

  return (
    <section id="faq" className="py-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
            FAQ
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-white/60">
            Everything you need to know about TubeGrow.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {faqCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? "bg-brand-500 text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Questions accordion */}
        <div className="space-y-0">
          {activeQuestions.map((item, index) => {
            const isOpen = openQuestions.includes(item.question);

            return (
              <div key={index} className="faq-item">
                <button
                  onClick={() => toggleQuestion(item.question)}
                  className="w-full flex items-center justify-between py-5 text-left"
                >
                  <span className="text-white font-medium pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 text-white/50 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="pb-5">
                    <p className="text-white/60 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-white/50 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@tubegrow.io"
            className="text-brand-500 hover:text-brand-400 font-medium transition-colors"
          >
            Contact our support team →
          </a>
        </div>
      </div>
    </section>
  );
}
