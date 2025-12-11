"use client";

import { Sparkles, Check } from "lucide-react";
import { getDetailedScoreColor } from "@/lib/utils";

interface TitleSuggestion {
  title: string;
  score: number;
}

interface TitleEditorProps {
  editTitle: string;
  onTitleChange: (title: string) => void;
  titleSuggestions: TitleSuggestion[];
  onApplyTitle: (title: string) => void;
}

export default function TitleEditor({
  editTitle,
  onTitleChange,
  titleSuggestions,
  onApplyTitle,
}: TitleEditorProps) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-5">
      <label className="block text-sm font-medium text-gray-400 mb-3">
        Title
      </label>
      <input
        type="text"
        value={editTitle}
        onChange={(e) => onTitleChange(e.target.value)}
        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white text-lg focus:outline-none focus:border-purple-500"
      />
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{editTitle.length}/100</span>
        <span
          className={
            editTitle.length >= 50 && editTitle.length <= 70
              ? "text-green-400"
              : ""
          }
        >
          Optimal: 50-70
        </span>
      </div>

      {/* Title Suggestions */}
      {titleSuggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-purple-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Click to apply
          </p>
          <div className="space-y-2">
            {titleSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onApplyTitle(s.title)}
                className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                  editTitle === s.title
                    ? "bg-purple-500/30 border border-purple-500"
                    : "bg-black/30 border border-transparent hover:border-purple-500/50"
                }`}
              >
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${getDetailedScoreColor(
                    s.score
                  )}`}
                >
                  {s.score}
                </span>
                <span className="text-white flex-1">{s.title}</span>
                {editTitle === s.title && (
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
