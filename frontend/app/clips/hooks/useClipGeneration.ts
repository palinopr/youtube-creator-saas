"use client";

import { useState, useCallback } from "react";
import { ClipSuggestion, GenerationProgress, API_URL } from "../types";

interface UseClipGenerationReturn {
  clips: ClipSuggestion[];
  generating: boolean;
  progress: GenerationProgress;
  error: string | null;
  generateClips: (videoId: string) => Promise<void>;
  clearClips: () => void;
  clearError: () => void;
}

export function useClipGeneration(): UseClipGenerationReturn {
  const [clips, setClips] = useState<ClipSuggestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress>({
    currentStep: 0,
    totalSteps: 5,
    statusMessage: "",
  });

  const clearClips = useCallback(() => {
    setClips([]);
    setError(null);
    setProgress({ currentStep: 0, totalSteps: 5, statusMessage: "" });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateClips = useCallback(async (videoId: string) => {
    console.log("[CLIPS] generateClips called for:", videoId);
    setGenerating(true);
    setError(null);
    setClips([]);
    setProgress({
      currentStep: 1,
      totalSteps: 3,
      statusMessage: "Analyzing transcript for viral moments..."
    });

    try {
      // Use POST endpoint directly (SSE doesn't support cookies for auth)
      const res = await fetch(`${API_URL}/api/clips/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          video_id: videoId,
          transcript: null,
          max_clips: 5,
        }),
      });

      setProgress({
        currentStep: 2,
        totalSteps: 3,
        statusMessage: "Processing candidates..."
      });

      if (res.ok) {
        const data = await res.json();
        setClips(data.clips || []);
        setProgress({
          currentStep: 3,
          totalSteps: 3,
          statusMessage: "Done!"
        });

        if (data.clips?.length === 0) {
          setError("No viral clip opportunities found in this video.");
        }
      } else {
        const errorData = await res.json();
        setError(errorData.detail || "Failed to generate clips");
      }
    } catch (err) {
      console.error("[CLIPS] Network error:", err);
      setError(
        `Network error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }

    setGenerating(false);
  }, []);

  return {
    clips,
    generating,
    progress,
    error,
    generateClips,
    clearClips,
    clearError,
  };
}
