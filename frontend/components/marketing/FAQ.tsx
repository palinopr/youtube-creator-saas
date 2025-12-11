"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does TubeGrow work?",
    answer:
      "TubeGrow connects to your YouTube channel through a secure OAuth integration. We analyze your video performance, audience behavior, and content patterns using AI to provide actionable insights and recommendations.",
  },
  {
    question: "Is my YouTube data safe?",
    answer:
      "Absolutely. We use industry-standard encryption and never share your data with third parties. We only request read-only access to your analytics - we can't modify your channel or videos in any way.",
  },
  {
    question: "Do I need technical knowledge to use TubeGrow?",
    answer:
      "Not at all! TubeGrow is designed for creators of all skill levels. Our AI assistant can answer questions in plain English, and all insights are presented in easy-to-understand formats.",
  },
  {
    question: "How is this different from YouTube Studio?",
    answer:
      "While YouTube Studio shows you basic metrics, TubeGrow uses AI to explain WHY your videos perform the way they do and WHAT to do about it. Plus, we offer features like automatic viral clip detection and AI-powered content suggestions.",
  },
  {
    question: "Can I try TubeGrow for free?",
    answer:
      "Yes! We offer a free plan that includes basic analytics and limited AI queries. You can upgrade anytime to access more features and higher limits.",
  },
  {
    question: "How does the viral clip generator work?",
    answer:
      "Our AI analyzes your video transcripts and engagement patterns to identify moments with the highest viral potential. It looks for hooks, emotional peaks, and quotable segments that work well as Shorts or TikTok clips.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400">
            Everything you need to know about TubeGrow
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-white pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
