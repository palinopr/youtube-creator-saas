"use client";

import { useState } from "react";
import { Sparkles, Check, X } from "lucide-react";

interface TagsEditorProps {
  editTags: string[];
  onTagsChange: (tags: string[]) => void;
  tagSuggestions: string[];
  transcriptTags: string[];
}

export default function TagsEditor({
  editTags,
  onTagsChange,
  tagSuggestions,
  transcriptTags,
}: TagsEditorProps) {
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      onTagsChange([...editTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const addTag = (tag: string) => {
    if (!editTags.includes(tag)) {
      onTagsChange([...editTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(editTags.filter((t) => t !== tagToRemove));
  };

  const addAllSuggested = () => {
    const allSuggested = Array.from(new Set([...tagSuggestions, ...transcriptTags]));
    const newTags = allSuggested.filter((t) => !editTags.includes(t));
    onTagsChange([...editTags, ...newTags]);
  };

  const combinedSuggestions = Array.from(new Set([...tagSuggestions, ...transcriptTags]));

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-5">
      <label className="block text-sm font-medium text-gray-400 mb-3">
        Tags
      </label>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), handleAddTag())
          }
          className="flex-1 px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          placeholder="Add a tag..."
        />
        <button
          onClick={handleAddTag}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {editTags.map((tag, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-white ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {editTags.length === 0 && (
          <span className="text-gray-500 text-sm">No tags yet</span>
        )}
      </div>

      {/* AI Suggested Tags - Combined */}
      {combinedSuggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Suggested Tags
              </p>
              {transcriptTags.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {combinedSuggestions.join(", ").length}/500 chars
                </p>
              )}
            </div>
            <button
              onClick={addAllSuggested}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium"
            >
              Add All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {combinedSuggestions.map((tag, i) => (
              <button
                key={i}
                onClick={() => addTag(tag)}
                disabled={editTags.includes(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  editTags.includes(tag)
                    ? "bg-emerald-500/40 text-emerald-200"
                    : "bg-white/10 text-white hover:bg-emerald-500/30"
                }`}
              >
                {editTags.includes(tag) && (
                  <Check className="w-3 h-3 inline mr-1" />
                )}
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
