"use client";

import { ClipSegment, formatDuration } from "../types";

type SegmentType = "hook" | "body" | "loop";

const segmentStyles: Record<SegmentType, { bg: string; text: string; label: string }> = {
  hook: {
    bg: "bg-purple-500/30",
    text: "text-purple-300",
    label: "HOOK",
  },
  body: {
    bg: "bg-blue-500/30",
    text: "text-blue-300",
    label: "BODY",
  },
  loop: {
    bg: "bg-orange-500/30",
    text: "text-orange-300",
    label: "LOOP",
  },
};

interface SegmentBadgeProps {
  type: SegmentType;
  segment: ClipSegment;
  showTimestamp?: boolean;
  truncate?: boolean;
}

export function SegmentBadge({
  type,
  segment,
  showTimestamp = false,
  truncate = false,
}: SegmentBadgeProps) {
  const style = segmentStyles[type];

  return (
    <div className="flex items-start gap-2 group">
      {/* Badge */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className={`px-2 py-0.5 ${style.bg} ${style.text} rounded text-xs font-medium`}
        >
          {style.label}
        </span>
        {showTimestamp && (
          <span className="text-[10px] text-gray-500 font-mono">
            {formatDuration(segment.start_time)}
          </span>
        )}
      </div>

      {/* Text */}
      <p
        className={`text-gray-300 text-sm leading-relaxed ${
          truncate ? "line-clamp-1" : ""
        }`}
      >
        "{segment.text}"
      </p>
    </div>
  );
}

// Compact version for mini-timeline
export function SegmentDot({ type }: { type: SegmentType }) {
  const colors: Record<SegmentType, string> = {
    hook: "bg-purple-500",
    body: "bg-blue-500",
    loop: "bg-orange-500",
  };

  return (
    <div
      className={`w-2 h-2 rounded-full ${colors[type]} ring-2 ring-black`}
      title={type.toUpperCase()}
    />
  );
}
