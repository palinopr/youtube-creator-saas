"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "@/lib/config";
import { Bot, X, Send, Loader2, Sparkles, Mail, AlertCircle, User } from "lucide-react";

type AgentResult = {
  title?: string;
  answer?: string;
  next_steps?: string[] | string;
  suggested_pages?: { label: string; url: string }[];
  disclaimer?: string;
};

type ChatItem =
  | { role: "user"; text: string }
  | { role: "agent"; result: AgentResult };

const STORAGE_EMAIL = "tubegrow_lead_email";
const STORAGE_NAME = "tubegrow_lead_name";
const STORAGE_LEAD_ID = "tubegrow_lead_id";

const promptChips = [
  "What does TubeGrow do?",
  "How does the AI agent work?",
  "How do I improve YouTube SEO for my next video?",
  "How should I turn a long video into Shorts?",
];

export default function LeadAgentWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"lead" | "chat">("lead");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_EMAIL) || "";
    const savedName = localStorage.getItem(STORAGE_NAME) || "";
    const savedLeadId = localStorage.getItem(STORAGE_LEAD_ID) || "";

    if (savedEmail) setEmail(savedEmail);
    if (savedName) setName(savedName);
    if (savedLeadId) setLeadId(savedLeadId);

    if (savedEmail && savedLeadId) {
      setStep("chat");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [open, chat, loading]);

  const baseUrl = useMemo(() => API_URL.replace(/\/+$/, ""), []);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const createLead = async () => {
    setError(null);
    const cleanedName = name.trim();
    if (!cleanedName) {
      setError("Enter your name to continue.");
      return;
    }

    const emailNorm = email.trim().toLowerCase();
    if (!validateEmail(emailNorm)) {
      setError("Enter a valid email address to continue.");
      return;
    }

    setLeadLoading(true);
    try {
      const res = await fetch(`${baseUrl}/public/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailNorm,
          name: cleanedName,
          source: "landing_agent",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Failed to save email.");

      const newLeadId = data?.lead_id as string;
      if (!newLeadId) throw new Error("No lead id returned.");

      localStorage.setItem(STORAGE_EMAIL, emailNorm);
      localStorage.setItem(STORAGE_NAME, cleanedName);
      localStorage.setItem(STORAGE_LEAD_ID, newLeadId);
      setLeadId(newLeadId);
      setStep("chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLeadLoading(false);
    }
  };

  const ask = async (q: string) => {
    setError(null);
    const emailNorm = email.trim().toLowerCase();
    if (!validateEmail(emailNorm) || !leadId) {
      setStep("lead");
      setError("Enter your email to continue.");
      return;
    }

    const cleaned = q.trim();
    if (!cleaned) return;

    setChat((prev) => [...prev, { role: "user", text: cleaned }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/public/agent/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailNorm,
          lead_id: leadId,
          question: cleaned,
          page_url: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Failed to get an answer.");

      const result = (data?.result || {}) as AgentResult;
      setChat((prev) => [...prev, { role: "agent", result }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    void ask(question);
  };

  const normalizeNextSteps = (value: AgentResult["next_steps"]): string[] => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
  };

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        className="fixed bottom-5 right-5 z-[60] rounded-full shadow-lg shadow-black/40 border border-white/10 bg-gradient-to-br from-brand-500 to-accent-500 text-white px-4 py-3 flex items-center gap-2 hover:opacity-95 transition-opacity"
        onClick={() => setOpen(true)}
        aria-label="Open TubeGrow AI agent"
      >
        <Bot className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">Ask TubeGrow</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full sm:max-w-md rounded-2xl border border-white/10 bg-[#040E22] shadow-xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <div className="text-white font-semibold leading-tight">TubeGrow AI Agent</div>
                  <div className="text-white/60 text-xs leading-tight">
                    TubeGrow + YouTube growth only
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="text-white/70 hover:text-white transition-colors p-2"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div ref={listRef} className="max-h-[70vh] sm:max-h-[520px] overflow-y-auto p-4 space-y-4">
              {step === "lead" ? (
                <div className="space-y-4">
                  <p className="text-white/80 text-sm leading-relaxed">
                    Ask anything about TubeGrow and how to grow on YouTube. Enter your email to start.
                  </p>

                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-white/40" />
                      </div>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        type="text"
                        autoComplete="name"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-white/40" />
                      </div>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        type="email"
                        autoComplete="email"
                      />
                    </div>

                    <button
                      type="button"
                      className="w-full btn-cta-primary rounded-xl py-2.5 flex items-center justify-center gap-2"
                      onClick={() => void createLead()}
                      disabled={leadLoading}
                    >
                      {leadLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Starting…</span>
                        </>
                      ) : (
                        <span>Start chatting</span>
                      )}
                    </button>

                    <p className="text-white/40 text-xs">
                      We use this to follow up with TubeGrow updates. Free tier available.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {chat.length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-white/70 text-sm">
                        Try one of these:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {promptChips.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
                            onClick={() => void ask(p)}
                            disabled={loading}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {chat.map((item, idx) => {
                    if (item.role === "user") {
                      return (
                        <div key={idx} className="flex justify-end">
                          <div className="max-w-[85%] rounded-2xl bg-white/10 border border-white/10 px-3 py-2 text-white text-sm">
                            {item.text}
                          </div>
                        </div>
                      );
                    }

                    const r = item.result || {};
                    const nextSteps = normalizeNextSteps(r.next_steps);
                    return (
                      <div key={idx} className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm space-y-2">
                          {r.title ? <div className="font-semibold">{r.title}</div> : null}
                          {r.answer ? <div className="text-white/80 leading-relaxed whitespace-pre-wrap">{r.answer}</div> : null}
                          {nextSteps.length ? (
                            <div className="pt-1">
                              <div className="text-white/60 text-xs mb-1">Next steps</div>
                              <ul className="space-y-1">
                                {nextSteps.slice(0, 6).map((s) => (
                                  <li key={s} className="text-white/80 text-sm">
                                    • {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {r.suggested_pages?.length ? (
                            <div className="pt-1">
                              <div className="text-white/60 text-xs mb-1">Suggested pages</div>
                              <div className="flex flex-col gap-1">
                                {r.suggested_pages.slice(0, 5).map((p) => (
                                  <a
                                    key={p.url}
                                    href={p.url}
                                    className="text-brand-300 hover:text-brand-200 text-sm underline underline-offset-2"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {p.label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {r.disclaimer ? (
                            <div className="text-white/40 text-xs">{r.disclaimer}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {loading ? (
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Thinking…
                    </div>
                  ) : null}
                </>
              )}

              {error ? (
                <div className="flex items-start gap-2 text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : null}
            </div>

            {/* Footer input */}
            {step === "chat" ? (
              <form onSubmit={onSubmitQuestion} className="border-t border-white/10 p-3 bg-black/20">
                <div className="flex items-center gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask about TubeGrow…"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white flex items-center justify-center disabled:opacity-50"
                    disabled={loading}
                    aria-label="Send"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-white/30 text-[11px] mt-2">
                  Free tier available. Answers are guidance, not guarantees.
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
