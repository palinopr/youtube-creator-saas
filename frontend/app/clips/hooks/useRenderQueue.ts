"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ClipSuggestion, RenderJob, API_URL } from "../types";

interface UseRenderQueueReturn {
  renderJobs: Record<string, RenderJob>;
  renderClip: (clip: ClipSuggestion, videoId: string) => Promise<void>;
  downloadClip: (clipId: string) => void;
  clearJobs: () => void;
}

export function useRenderQueue(): UseRenderQueueReturn {
  const [renderJobs, setRenderJobs] = useState<Record<string, RenderJob>>({});
  const [jobToClipMap, setJobToClipMap] = useState<Record<string, string>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Try WebSocket connection, fallback to polling
  const startTracking = useCallback((jobId: string, clipId: string) => {
    // Store mapping
    setJobToClipMap((prev) => ({ ...prev, [jobId]: clipId }));

    // Try WebSocket first
    const wsUrl = `${API_URL.replace("http", "ws")}/api/clips/ws/render/${jobId}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WS] Connected for job:", jobId);
        wsRef.current = ws;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WS] Update:", data);

          setRenderJobs((prev) => ({
            ...prev,
            [clipId]: {
              job_id: jobId,
              status: data.status,
              progress: data.progress || 0,
              message: data.message || "",
              ready_for_download: data.ready_for_download || false,
            },
          }));

          // Close WebSocket when complete or failed
          if (data.status === "completed" || data.status === "failed") {
            ws.close();
          }
        } catch (e) {
          console.error("[WS] Parse error:", e);
        }
      };

      ws.onerror = () => {
        console.log("[WS] Error, falling back to polling");
        ws.close();
        startPolling(jobId, clipId);
      };

      ws.onclose = () => {
        console.log("[WS] Closed for job:", jobId);
      };
    } catch (e) {
      console.log("[WS] Failed to connect, using polling");
      startPolling(jobId, clipId);
    }
  }, []);

  // Fallback polling
  const startPolling = useCallback((jobId: string, clipId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/clips/${jobId}/status`, {
          credentials: "include",
        });

        if (res.ok) {
          const job = await res.json();
          setRenderJobs((prev) => ({ ...prev, [clipId]: job }));

          // Stop polling if complete or failed
          if (job.status === "completed" || job.status === "failed") {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        }
      } catch (e) {
        console.error("[POLL] Error:", e);
      }
    };

    // Initial poll
    poll();

    // Start interval
    pollingRef.current = setInterval(poll, 2000);
  }, []);

  const renderClip = useCallback(
    async (clip: ClipSuggestion, videoId: string) => {
      try {
        // Build segments from the actual AI-detected timestamps
        const segments: { start: number; end: number }[] = [];

        // Add hook segment
        if (clip.hook) {
          segments.push({
            start: clip.hook.start_time,
            end: clip.hook.end_time,
          });
        }

        // Add body segments
        if (clip.body_segments && clip.body_segments.length > 0) {
          for (const seg of clip.body_segments) {
            segments.push({
              start: seg.start_time,
              end: seg.end_time,
            });
          }
        }

        // Add loop ending segment
        if (clip.loop_ending) {
          segments.push({
            start: clip.loop_ending.start_time,
            end: clip.loop_ending.end_time,
          });
        }

        // Fallback if no segments found
        if (segments.length === 0) {
          console.error("No segments found in clip!");
          return;
        }

        console.log("[CLIPS] Rendering with segments:", segments);

        const res = await fetch(`${API_URL}/api/clips/render`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            video_id: videoId,
            clip_id: clip.clip_id,
            segments: segments,
            title: clip.title,
            prefer_oauth: true, // Use OAuth for SaaS mode - user's own videos
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const jobId = data.job_id;

          // Set initial job state
          setRenderJobs((prev) => ({
            ...prev,
            [clip.clip_id]: {
              job_id: jobId,
              status: "queued",
              progress: 0,
              message: "Starting render...",
              ready_for_download: false,
            },
          }));

          // Start tracking (WebSocket or polling)
          startTracking(jobId, clip.clip_id);
        }
      } catch (error) {
        console.error("Render error:", error);
      }
    },
    [startTracking]
  );

  const downloadClip = useCallback(
    (clipId: string) => {
      const job = renderJobs[clipId];
      if (!job || !job.ready_for_download) return;

      window.open(`${API_URL}/api/clips/${job.job_id}/download`, "_blank");
    },
    [renderJobs]
  );

  const clearJobs = useCallback(() => {
    setRenderJobs({});
    setJobToClipMap({});
  }, []);

  return {
    renderJobs,
    renderClip,
    downloadClip,
    clearJobs,
  };
}
