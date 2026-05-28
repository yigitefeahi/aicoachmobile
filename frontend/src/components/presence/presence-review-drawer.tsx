"use client";

import { ChevronDown, Volume2, X } from "lucide-react";
import { CoachPanel } from "@/components/live/coach-panel";

type PresenceReviewDrawerProps = {
  open: boolean;
  onClose: () => void;
  mode: string;
  score: number | null;
  confidenceScore: number | null;
  feedback: string;
  scoreExplanation: string;
  canRetry: boolean;
  attemptsLeft: number;
  pendingNextQuestion: string | null;
  isSpeaking: boolean;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  redFlags: string[];
  onReplayVoice: () => void;
  onContinueNextQuestion: () => void;
};

export function PresenceReviewDrawer({
  open,
  onClose,
  ...coachProps
}: PresenceReviewDrawerProps) {
  if (!open) return null;

  return (
    <div className="presence-review-drawer fixed inset-x-0 bottom-0 z-40 max-h-[min(72vh,640px)]">
      <div
        className="absolute inset-0 -top-[100vh] bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex max-h-[min(72vh,640px)] flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#141414]/98 shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
              Answer reviewed
            </p>
            <h2 className="text-base font-semibold text-white">Coach feedback</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={coachProps.onReplayVoice}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
            >
              <Volume2 size={14} />
              Replay
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-slate-200 hover:bg-white/12"
              aria-label="Close feedback panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <CoachPanel {...coachProps} />
        </div>

        <div className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b5cff] py-3 text-sm font-semibold text-white hover:bg-[#0a4fe0]"
          >
            <ChevronDown size={16} />
            Continue interview
          </button>
        </div>
      </div>
    </div>
  );
}
