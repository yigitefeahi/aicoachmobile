"use client";

import { AlertTriangle, CheckCircle2, Lightbulb, Mic, Play, Send, Square, Video } from "lucide-react";
import type { ReactNode } from "react";

type InterviewAnswerPanelProps = {
  icon: ReactNode;
  currentQuestion: string;
  mode: string;
  answer: string;
  loading: boolean;
  recording: boolean;
  audioReady: boolean;
  speechTranscript: string;
  recordedBlob: Blob | null;
  sessionId: string;
  profession: string;
  difficulty: string;
  length: string;
  focusArea: string;
  /** Brief flash after audio blob is captured */
  recordingSavedFlash?: boolean;
  /** After server returns evaluation (non-terminal) */
  analysisSuccess?: boolean;
  /** After question was passed (skip) — amber notice, not success green */
  passNotice?: boolean;
  /** Large standalone question above controls */
  questionVariant?: "default" | "hero";
  onAnswerChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmit: () => void;
  onClear: () => void;
  onPassQuestion: () => void;
  onAskHint?: () => void;
  hint?: {
    hint: string;
    bullets: string[];
    ragSummary?: string;
    retrievalQuality?: { label?: string; score?: number };
    evidence?: Array<{ source?: string; preview?: string; relevance_label?: string; hybrid_score?: number }>;
  } | null;
  hintLoading?: boolean;
};

export function InterviewAnswerPanel({
  icon,
  currentQuestion,
  mode,
  answer,
  loading,
  recording,
  audioReady,
  speechTranscript,
  recordedBlob,
  sessionId,
  profession,
  difficulty,
  length,
  focusArea,
  recordingSavedFlash = false,
  analysisSuccess = false,
  passNotice = false,
  questionVariant = "hero",
  onAnswerChange,
  onStartRecording,
  onStopRecording,
  onSubmit,
  onClear,
  onPassQuestion,
  onAskHint,
  hint,
  hintLoading = false,
}: InterviewAnswerPanelProps) {
  return (
    <div className="glass panel flex min-h-0 flex-col">
      {questionVariant === "hero" ? (
        <div className="mb-4 flex shrink-0 items-center gap-3">
          <div className="rounded-2xl bg-violet-500/20 p-3">{icon}</div>
          <div>
            <div className="font-semibold">Your response</div>
            <div className="text-sm text-slate-300">Use the controls below for the selected mode.</div>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex shrink-0 items-center gap-3">
          <div className="rounded-2xl bg-violet-500/20 p-3">{icon}</div>
          <div>
            <div className="font-semibold">Current Question</div>
            <div className="text-sm text-slate-300">Answer in the selected interview mode.</div>
          </div>
        </div>
      )}

      {passNotice && (
        <div className="mb-4 flex shrink-0 items-start gap-3 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
          <div>
            <div className="font-semibold text-amber-100">Question skipped (pass used)</div>
            <p className="mt-1 text-amber-100/90">
              Your pass was recorded. Continue with the next question when you are ready.
            </p>
          </div>
        </div>
      )}

      {recordingSavedFlash && mode === "audio" && (
        <div className="mb-4 flex shrink-0 items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
          <span>Successfully recorded — ready to send for analysis.</span>
        </div>
      )}

      {analysisSuccess && (
        <div className="mb-4 flex shrink-0 flex-col gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
            <span>
              {mode === "text"
                ? "Answer received"
                : mode === "audio"
                  ? "Recording received"
                  : "Response received"}
            </span>
          </div>
          <div className="flex items-center gap-2 pl-7 text-emerald-100/95">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400/90" aria-hidden />
            <span>Successfully analyzed — see feedback on the right.</span>
          </div>
        </div>
      )}

      {hint && (
        <div className="mb-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <Lightbulb size={16} />
            Hint
          </div>
          <p className="text-slate-300">{hint.hint}</p>
          {hint.bullets.length > 0 && (
            <ul className="mt-2 space-y-1 text-slate-300">
              {hint.bullets.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          )}
          {(hint.ragSummary || hint.evidence?.length) && (
            <div className="mt-3 rounded-xl border border-cyan-300/20 bg-black/10 p-3 text-xs text-cyan-100">
              <div className="font-semibold">
                RAG evidence {hint.retrievalQuality?.label ? `· ${hint.retrievalQuality.label}` : ""}
                {typeof hint.retrievalQuality?.score === "number" ? ` (${hint.retrievalQuality.score}/100)` : ""}
              </div>
              {hint.ragSummary && <p className="mt-1 text-cyan-100/80">{hint.ragSummary}</p>}
              {!!hint.evidence?.length && (
                <ul className="mt-2 space-y-1 text-cyan-100/75">
                  {hint.evidence.slice(0, 2).map((item, index) => (
                    <li key={`${item.source || "source"}-${index}`}>
                      {item.source || "knowledge base"}: {item.preview}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {questionVariant === "default" && (
        <div className="card-soft shrink-0 p-5">
          <p className="text-lg leading-8">{currentQuestion}</p>
        </div>
      )}

      <div className={`flex min-h-0 flex-1 flex-col ${questionVariant === "hero" ? "mt-0" : "mt-6"}`}>
        {(mode === "text" || mode === "case") && (
          <div className="flex min-h-0 flex-1 flex-col">
            <label className="label" htmlFor="interview-answer-text">
              Your Answer
            </label>
            <textarea
              id="interview-answer-text"
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Write your answer here..."
              className="textarea min-h-[min(52vh,560px)] w-full max-w-none text-base leading-relaxed"
              spellCheck
            />
          </div>
        )}

        {mode === "audio" && (
          <div className="card-soft p-6">
            <div className="mb-4 flex items-center gap-3">
              <Mic size={18} />
              <span className="font-medium">Audio Mode</span>
            </div>
            <p className="text-sm text-slate-300">
              Record your spoken answer and submit it for transcription and evaluation.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={onStartRecording} disabled={recording || loading} className="btn-primary">
                <Play size={16} />
                Start Recording
              </button>
              <button type="button" onClick={onStopRecording} disabled={!recording || loading} className="btn-secondary">
                <Square size={16} />
                Stop Recording
              </button>
            </div>
            <div className="mt-4 text-sm text-slate-300">
              {recording
                ? "Recording in progress..."
                : speechTranscript
                  ? "Speech transcript captured and ready."
                  : recordedBlob
                    ? "Audio recorded and ready to submit."
                    : audioReady
                      ? "Recorder ready."
                      : "No recording yet."}
            </div>
            {!!speechTranscript && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                Transcript: {speechTranscript}
              </div>
            )}
          </div>
        )}

        {mode === "video" && (
          <div className="card-soft p-6">
            <div className="mb-4 flex items-center gap-3">
              <Video size={18} />
              <span className="font-medium">Video Mode</span>
            </div>
            <p className="text-sm text-slate-300">Video answer flow is on the dedicated video page.</p>
            <div className="mt-4 flex gap-3">
              <a
                href={`/interview/video?session_id=${encodeURIComponent(sessionId)}&profession=${encodeURIComponent(
                  profession
                )}&difficulty=${encodeURIComponent(difficulty)}&mode=${encodeURIComponent(
                  mode
                )}&length=${encodeURIComponent(length)}&focusArea=${encodeURIComponent(
                  focusArea
                )}&question=${encodeURIComponent(currentQuestion)}`}
                className="btn-primary"
              >
                Open Video Screen
              </a>
            </div>
          </div>
        )}
      </div>

      {mode !== "video" && (
        <div className="mt-5 flex shrink-0 flex-wrap gap-3">
          <button
            onClick={onSubmit}
            className="btn-primary"
            disabled={loading || (mode === "text" || mode === "case" ? !answer.trim() : !recordedBlob && !speechTranscript.trim())}
            type="button"
          >
            <Send size={16} />
            {loading ? "Submitting..." : "Submit Answer"}
          </button>
          <button onClick={onClear} className="btn-secondary" type="button" disabled={loading}>
            Clear
          </button>
          {onAskHint && (
            <button onClick={onAskHint} className="btn-secondary" type="button" disabled={loading || hintLoading}>
              <Lightbulb size={16} />
              {hintLoading ? "Getting Hint..." : "Ask for a Hint"}
            </button>
          )}
          <button onClick={onPassQuestion} className="btn-secondary" type="button" disabled={loading}>
            Pass Question (up to 3/session)
          </button>
        </div>
      )}
    </div>
  );
}
