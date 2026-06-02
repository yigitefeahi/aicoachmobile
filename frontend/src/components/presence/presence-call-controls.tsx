"use client";

import {
  Keyboard,
  LogOut,
  Mic,
  Phone,
  SkipForward,
  Volume2,
} from "lucide-react";
import Link from "next/link";

type PresenceCallControlsProps = {
  conversationStarted: boolean;
  avatarReady: boolean;
  loading: boolean;
  isSpeaking: boolean;
  phase: string;
  showManualInput: boolean;
  onJoin: () => void;
  onReplayQuestion: () => void;
  onPassQuestion: () => void;
  onToggleManualInput: () => void;
};

export function PresenceCallControls({
  conversationStarted,
  avatarReady,
  loading,
  isSpeaking,
  phase,
  showManualInput,
  onJoin,
  onReplayQuestion,
  onPassQuestion,
  onToggleManualInput,
}: PresenceCallControlsProps) {
  return (
    <footer className="presence-controls z-30 shrink-0 border-t border-white/10 bg-[#111111]/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 sm:gap-3">
        {!conversationStarted ? (
          <button
            type="button"
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-[#0b5cff] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0a4fe0] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!avatarReady}
            onClick={onJoin}
          >
            <Phone size={16} />
            Join interview
          </button>
        ) : (
          <>
            <ControlButton
              label={phase === "listening" ? "Mic live" : "Mic"}
              active={phase === "listening"}
              statusOnly
              icon={<Mic size={18} />}
            />
            <ControlButton
              label="Replay Q"
              disabled={loading || isSpeaking || phase === "processing"}
              onClick={onReplayQuestion}
              icon={<Volume2 size={18} />}
            />
            <ControlButton
              label="Pass"
              disabled={loading || phase === "processing"}
              onClick={onPassQuestion}
              icon={<SkipForward size={18} />}
            />
            <ControlButton
              label={showManualInput ? "Hide keyboard" : "Type answer"}
              active={showManualInput}
              onClick={onToggleManualInput}
              icon={<Keyboard size={18} />}
            />
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/15 px-4 py-2.5 text-sm font-medium text-rose-100 transition hover:bg-rose-500/25"
            >
              <LogOut size={16} />
              Leave
            </Link>
          </>
        )}
      </div>
    </footer>
  );
}

function ControlButton({
  label,
  icon,
  active = false,
  disabled = false,
  statusOnly = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  /** Non-clickable status chip (e.g. mic indicator) — keeps label at full contrast */
  statusOnly?: boolean;
  onClick?: () => void;
}) {
  const isDisabled = disabled && !statusOnly;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      aria-disabled={statusOnly ? true : undefined}
      className={`presence-control-btn inline-flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 transition ${
        isDisabled ? "cursor-not-allowed" : statusOnly ? "cursor-default" : ""
      } ${active ? "is-active" : ""}`}
    >
      <span
        className={`presence-control-icon flex h-10 w-10 items-center justify-center rounded-full ${
          isDisabled ? "is-disabled" : ""
        }`}
      >
        {icon}
      </span>
      <span
        className={`presence-control-label text-xs font-semibold leading-tight ${
          active ? "is-active" : ""
        } ${isDisabled ? "is-disabled" : ""}`}
      >
        {label}
      </span>
    </button>
  );
}
