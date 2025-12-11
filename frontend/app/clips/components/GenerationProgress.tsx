"use client";

import { Loader2, CheckCircle, Wifi, FileVideo, FileText, Clock, Sparkles } from "lucide-react";
import { GenerationProgress as ProgressState } from "../types";

interface GenerationProgressProps {
  progress: ProgressState;
}

const steps = [
  { label: "Connect", icon: Wifi },
  { label: "Video Info", icon: FileVideo },
  { label: "Transcript", icon: FileText },
  { label: "Timestamps", icon: Clock },
  { label: "AI Analysis", icon: Sparkles },
];

export function GenerationProgress({ progress }: GenerationProgressProps) {
  const { currentStep, totalSteps, statusMessage } = progress;
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/30 rounded-xl p-6 mb-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
          <div className="absolute inset-0 bg-pink-500/20 blur-xl" />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium text-base">
            {statusMessage || "Analyzing video for viral moments..."}
          </p>
          <p className="text-pink-300/70 text-sm mt-0.5">
            Step {currentStep} of {totalSteps}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-pink-400">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full bg-black/40 rounded-full h-3 overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500 ease-out rounded-full relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isComplete = currentStep > stepNum;
          const isActive = currentStep === stepNum;
          const StepIcon = step.icon;

          return (
            <StepIndicator
              key={stepNum}
              step={stepNum}
              label={step.label}
              icon={<StepIcon className="w-3.5 h-3.5" />}
              isComplete={isComplete}
              isActive={isActive}
            />
          );
        })}
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  label,
  icon,
  isComplete,
  isActive,
}: {
  step: number;
  label: string;
  icon: React.ReactNode;
  isComplete: boolean;
  isActive: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      {/* Circle */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
          isComplete
            ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30"
            : isActive
            ? "bg-pink-500/30 text-pink-400 ring-2 ring-pink-500 ring-offset-2 ring-offset-[#111]"
            : "bg-white/10 text-gray-500"
        }`}
      >
        {isComplete ? <CheckCircle className="w-4 h-4" /> : icon}
      </div>

      {/* Label */}
      <span
        className={`mt-2 text-xs font-medium transition-colors ${
          isComplete || isActive ? "text-pink-400" : "text-gray-500"
        }`}
      >
        {label}
      </span>

      {/* Connector line (not for last item) */}
      {step < 5 && (
        <div
          className={`hidden sm:block absolute h-0.5 w-12 top-4 -right-6 transition-colors ${
            isComplete ? "bg-pink-500" : "bg-white/10"
          }`}
          style={{ transform: "translateX(50%)" }}
        />
      )}
    </div>
  );
}

// Compact progress bar for inline use (e.g., in VideoHero)
export function GenerationProgressBar({ progress }: GenerationProgressProps) {
  const { currentStep, totalSteps, statusMessage } = progress;
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
          {statusMessage || "Analyzing..."}
        </span>
        <span className="text-pink-400 font-medium">
          {Math.round(progressPercent)}%
        </span>
      </div>
      <div className="relative w-full bg-black/40 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500 ease-out rounded-full relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
