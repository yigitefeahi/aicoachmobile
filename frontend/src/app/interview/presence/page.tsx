"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Mic,
  Send,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { safeText } from "@/lib/safe-text";
import { buildSessionContextLine } from "@/lib/question-display";
import { useInterviewSessionHydration } from "@/lib/interview-session-hydration";
import { createSpeechEndDetector } from "@/lib/speech-end-detector";
import { usePresenceWebcam } from "@/lib/use-presence-webcam";
import { PresenceCallControls } from "@/components/presence/presence-call-controls";
import { PresenceAnswerConfirm } from "@/components/presence/presence-answer-confirm";
import { PresenceReviewDrawer } from "@/components/presence/presence-review-drawer";
import { PresenceSelfView } from "@/components/presence/presence-self-view";
import type { TalkingHeadAvatarHandle } from "@/components/presence/talking-head-avatar";

const TalkingHeadAvatar = dynamic(
  () =>
    import("@/components/presence/talking-head-avatar").then((mod) => mod.TalkingHeadAvatar),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#161616] text-sm text-slate-300">
        Preparing 3D interviewer…
      </div>
    ),
  }
);

type SubmitResponse = {
  next_question: string | null;
  pending_next_question?: string | null;
  question_context?: string | null;
  question_rationale?: string | null;
  feedback: string;
  score: number;
  done: boolean;
  can_retry?: boolean;
  attempts_left?: number;
  confidence_score?: number;
  red_flags?: string[];
  passes_left?: number;
  question_index?: number;
  total_questions?: number;
  sub_scores?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  score_explanation?: string;
};

type ConversationPhase =
  | "idle"
  | "booting"
  | "interviewer_speaking"
  | "listening"
  | "processing";

const MODE = "presence";
const INTERVIEWER_NAME = "Alex";
/** Pause this long (no new speech) before asking to submit */
const PRESENCE_SILENCE_MS = 5000;

function formatCallDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function phaseLabel(phase: ConversationPhase, answerConfirmOpen: boolean): string {
  if (answerConfirmOpen && phase === "listening") {
    return "Confirm — submit your answer or keep speaking";
  }
  switch (phase) {
    case "idle":
      return "Waiting to join";
    case "booting":
      return "Connecting to interview room…";
    case "interviewer_speaking":
      return `${INTERVIEWER_NAME} is speaking`;
    case "listening":
      return "Your turn — speak naturally, pause when finished";
    case "processing":
      return "Evaluating your answer…";
    default:
      return "";
  }
}

function PresenceInterviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id") || "";

  const urlFallback = useMemo(
    () => ({
      profession: searchParams.get("profession") || undefined,
      difficulty: searchParams.get("difficulty") || undefined,
      mode: "presence" as const,
      length: searchParams.get("length") || undefined,
      focusArea: searchParams.get("focusArea") || undefined,
      sector: searchParams.get("sector") || undefined,
      company: searchParams.get("company") || undefined,
      companyPack: searchParams.get("companyPack") || undefined,
      instantMode: searchParams.get("instantMode") === "true",
      interviewDate: searchParams.get("interviewDate") || undefined,
      question: searchParams.get("question") || undefined,
      questionRationale: searchParams.get("questionRationale") || undefined,
      questionContext: searchParams.get("questionContext") || undefined,
    }),
    [searchParams]
  );

  const { session, hydrating, hydrationError } = useInterviewSessionHydration(
    sessionId,
    urlFallback
  );

  const profession = session.profession;
  const difficulty = session.difficulty;
  const length = session.length;
  const focusArea = session.focusArea;
  const sector = session.sector;
  const targetCompany = session.targetCompany;

  const [sessionQuestionContext, setSessionQuestionContext] = useState(
    () => searchParams.get("questionContext") || ""
  );

  const [currentQuestion, setCurrentQuestion] = useState(
    () => searchParams.get("question") || session.currentQuestion
  );
  const [questionRationale, setQuestionRationale] = useState(
    () => searchParams.get("questionRationale") || ""
  );
  const [liveTranscript, setLiveTranscript] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [feedback, setFeedback] = useState(
    "Your evaluation will appear here after each answer."
  );
  const [score, setScore] = useState<number | null>(null);
  const [scoreExplanation, setScoreExplanation] = useState<string>("");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [pendingNextQuestion, setPendingNextQuestion] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [passesLeft, setPassesLeft] = useState<number>(3);
  const [questionIndex, setQuestionIndex] = useState<number | null>(1);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(10);
  const [passNotice, setPassNotice] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [phase, setPhase] = useState<ConversationPhase>("idle");
  const [avatarReady, setAvatarReady] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [joinedToast, setJoinedToast] = useState(false);
  const [hasEvaluation, setHasEvaluation] = useState(false);
  const [answerConfirmOpen, setAnswerConfirmOpen] = useState(false);
  const [pendingAnswerText, setPendingAnswerText] = useState("");

  const avatarRef = useRef<TalkingHeadAvatarHandle | null>(null);
  const detectorRef = useRef<ReturnType<typeof createSpeechEndDetector> | null>(null);
  const phaseRef = useRef<ConversationPhase>("idle");
  const processingRef = useRef(false);
  const applyResponseRef = useRef<(data: SubmitResponse) => Promise<void>>(async () => {});
  const submitVoiceAnswerRef = useRef<(text: string) => Promise<void>>(async () => {});
  const resumeMetaRef = useRef({
    isResuming: false,
    questionIndex: 1,
    totalQuestions: 10,
  });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!sessionId) {
      router.push("/interview/setup");
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (hydrating) return;
    setCurrentQuestion(session.currentQuestion);
    setQuestionRationale(session.questionRationale);
    if (session.questionContext) {
      setSessionQuestionContext(session.questionContext);
    }
    setQuestionIndex(session.questionIndex);
    setTotalQuestions(session.totalQuestions);
    setPassesLeft(session.passesLeft);
    resumeMetaRef.current = {
      isResuming: session.isResuming,
      questionIndex: session.questionIndex,
      totalQuestions: session.totalQuestions,
    };
  }, [hydrating, session]);

  const webcamEnabled = conversationStarted || avatarReady;
  const { videoRef, ready: cameraReady, error: cameraError } = usePresenceWebcam({
    enabled: webcamEnabled,
  });

  useEffect(() => {
    if (!conversationStarted) {
      setCallSeconds(0);
      return;
    }

    const id = window.setInterval(() => {
      setCallSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, [conversationStarted]);

  const sessionLineForHero = useMemo(
    () =>
      sessionQuestionContext.trim() ||
      buildSessionContextLine({
        profession,
        difficulty,
        focusArea,
        sector,
        company: targetCompany,
      }),
    [sessionQuestionContext, profession, difficulty, focusArea, sector, targetCompany]
  );

  const stopListening = useCallback(() => {
    detectorRef.current?.stop();
  }, []);

  const speakInterviewer = useCallback(async (text: string) => {
    const handle = avatarRef.current;
    if (!handle?.isReady()) {
      throw new Error("Interviewer avatar is not ready.");
    }
    setPhase("interviewer_speaking");
    await handle.speak(text);
  }, []);

  const submitVoiceAnswer = useCallback(
    async (text: string) => {
      if (processingRef.current || phaseRef.current !== "listening") return;

      processingRef.current = true;
      setAnswerConfirmOpen(false);
      setPendingAnswerText("");
      setPhase("processing");
      stopListening();
      setLiveTranscript(text);
      setLoading(true);
      setAnalysisSuccess(false);

      try {
        const res = await apiFetch("/interview/answer/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: Number(sessionId), answer_text: text }),
        });
        const data: SubmitResponse = await res.json();
        await applyResponseRef.current(data);
      } catch (error) {
        console.error("Submit error:", error);
        setFeedback("An error occurred while submitting your answer.");
        setMicError("Could not submit your answer. Try again or type manually.");
        if (avatarRef.current?.isReady()) {
          await speakInterviewer("Sorry, I couldn't process that. Please try again.");
          startListeningRef.current();
        } else {
          setPhase("idle");
        }
      } finally {
        setLoading(false);
        processingRef.current = false;
      }
    },
    [sessionId, speakInterviewer, stopListening]
  );

  submitVoiceAnswerRef.current = submitVoiceAnswer;

  const startListeningRef = useRef<() => void>(() => {});

  const startListening = useCallback(() => {
    stopListening();
    setLiveTranscript("");
    setAnswerConfirmOpen(false);
    setPendingAnswerText("");
    setMicError(null);
    setPhase("listening");

    detectorRef.current = createSpeechEndDetector({
      silenceMs: PRESENCE_SILENCE_MS,
      minChars: 8,
      requireConfirmation: true,
      onTranscript: (text) => setLiveTranscript(text),
      onSilenceDetected: (text) => {
        if (processingRef.current || phaseRef.current !== "listening") return;
        setPendingAnswerText(text);
        setAnswerConfirmOpen(true);
      },
      onSpeechResumed: () => {
        setAnswerConfirmOpen(false);
        setPendingAnswerText("");
      },
      onError: (message) => setMicError(message),
      onSpeechEnd: (text) => {
        void submitVoiceAnswerRef.current(text);
      },
    });

    detectorRef.current.start();
  }, [stopListening]);

  startListeningRef.current = startListening;

  const applyResponse = useCallback(
    async (data: SubmitResponse) => {
    const qc = typeof data.question_context === "string" ? data.question_context.trim() : "";
    if (qc) {
      setSessionQuestionContext(qc);
    }

    setFeedback(safeText(data.feedback, "Feedback unavailable."));
    setScore(data.score ?? null);
      setHasEvaluation(true);
      setReviewOpen(true);
    setScoreExplanation(safeText(data.score_explanation));
      setStrengths(Array.isArray(data.strengths) ? data.strengths.map((x) => safeText(x)) : []);
      setWeaknesses(Array.isArray(data.weaknesses) ? data.weaknesses.map((x) => safeText(x)) : []);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.map((x) => safeText(x)) : []);
    setCanRetry(Boolean(data.can_retry));
    setAttemptsLeft(Number(data.attempts_left || 0));
    setPendingNextQuestion(
        data.pending_next_question != null ? safeText(data.pending_next_question) : null
      );
      setConfidenceScore(typeof data.confidence_score === "number" ? data.confidence_score : null);
      setRedFlags(Array.isArray(data.red_flags) ? data.red_flags.map((x) => safeText(x)) : []);
    setPassesLeft(typeof data.passes_left === "number" ? data.passes_left : passesLeft);
    setQuestionIndex(typeof data.question_index === "number" ? data.question_index : questionIndex);
    setTotalQuestions(typeof data.total_questions === "number" ? data.total_questions : totalQuestions);

      const qr =
        typeof data.question_rationale === "string" ? data.question_rationale.trim() : "";
      if (qr) {
        setQuestionRationale(qr);
      }

    if (data.done) {
        await speakInterviewer("Great work. This session is complete. Opening your results now.");
      router.push(`/results/${sessionId}`);
        return;
      }

      setManualAnswer("");
      setLiveTranscript("");
      setPassNotice(false);

      const feedbackLine = safeText(data.feedback, "");
      if (feedbackLine) {
        await speakInterviewer(feedbackLine);
      }

      if (data.can_retry) {
        setAnalysisSuccess(true);
        window.setTimeout(() => setAnalysisSuccess(false), 6000);
        await speakInterviewer("Let's stay on this question. Take another try when you're ready.");
        startListening();
        return;
      }

      const nextQuestion = data.next_question ? safeText(data.next_question) : "";
      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        setQuestionRationale(qr);
        await speakInterviewer(nextQuestion);
      }

      setAnalysisSuccess(true);
      window.setTimeout(() => setAnalysisSuccess(false), 6000);
      startListening();
    },
    [
      passesLeft,
      questionIndex,
      totalQuestions,
      router,
      sessionId,
      speakInterviewer,
      startListening,
    ]
  );

  applyResponseRef.current = applyResponse;

  useEffect(() => {
    applyResponseRef.current = applyResponse;
  }, [applyResponse]);

  const runOpeningTurn = useCallback(async () => {
    if (!avatarRef.current?.isReady()) return;
    setPhase("interviewer_speaking");
    const question = safeText(currentQuestion).trim();
    const { isResuming, questionIndex: qIdx, totalQuestions: qTotal } = resumeMetaRef.current;

    if (isResuming) {
      await speakInterviewer(
        `Welcome back. You're on question ${qIdx} of ${qTotal}. Here's the current question. ${question}`
      );
    } else {
      const intro =
        "Welcome to your mock interview room. I'll ask the questions, and you can answer out loud. When you finish, pause for a few seconds — we'll ask before submitting your answer.";
      await speakInterviewer(intro);
      if (question) {
        await speakInterviewer(`Here is your first question. ${question}`);
      }
    }
    startListening();
  }, [currentQuestion, speakInterviewer, startListening]);

  const beginConversation = useCallback(async () => {
    if (conversationStarted) return;
    setConversationStarted(true);
    setMicError(null);
    setPhase("booting");
    setJoinedToast(false);

    if (!avatarRef.current?.isReady()) {
      setPhase("idle");
      setMicError("Interviewer is still loading. Wait a moment and try again.");
      setConversationStarted(false);
      return;
    }

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 900);
    });

    setJoinedToast(true);
    window.setTimeout(() => setJoinedToast(false), 3200);

    try {
      await runOpeningTurn();
    } catch (error) {
      console.error("Opening turn error:", error);
      setMicError(
        error instanceof Error ? error.message : "Interviewer could not continue. Try Replay question."
      );
      setPhase("idle");
    }
  }, [conversationStarted, runOpeningTurn]);

  useEffect(() => {
    const avatar = avatarRef.current;
    return () => {
      stopListening();
      avatar?.stop();
    };
  }, [stopListening]);

  const handleManualSubmit = async () => {
    const text = manualAnswer.trim();
    if (!text) return;

    setAnswerConfirmOpen(false);
    setPendingAnswerText("");
    processingRef.current = true;
    stopListening();
    setPhase("processing");
    setLoading(true);
    setAnalysisSuccess(false);

    try {
      const res = await apiFetch("/interview/answer/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: Number(sessionId), answer_text: text }),
      });
      const data: SubmitResponse = await res.json();
      await applyResponse(data);
    } catch (error) {
      console.error("Manual submit error:", error);
      setFeedback("An error occurred while submitting your answer.");
      startListening();
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  const handlePassQuestion = async () => {
    try {
      setAnswerConfirmOpen(false);
      setPendingAnswerText("");
      processingRef.current = true;
      stopListening();
      setPhase("processing");
      setLoading(true);

      const res = await apiFetch("/interview/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: Number(sessionId) }),
      });
      const data: SubmitResponse = await res.json();

      const qc = typeof data.question_context === "string" ? data.question_context.trim() : "";
      if (qc) {
        setSessionQuestionContext(qc);
      }

      if (data.done) {
        await speakInterviewer("Session complete. Opening your results.");
        router.push(`/results/${sessionId}`);
        return;
      }

      if (data.next_question) {
        setCurrentQuestion(safeText(data.next_question));
      }

      const qr =
        typeof data.question_rationale === "string" ? data.question_rationale.trim() : "";
      if (qr) {
        setQuestionRationale(qr);
      }

      setPendingNextQuestion(null);
      setCanRetry(false);
      setAttemptsLeft(0);
      setFeedback(safeText(data.feedback, "Question passed."));
      setScore(data.score ?? null);
      setHasEvaluation(true);
      setReviewOpen(true);
      setScoreExplanation(data.score_explanation || "");
      setConfidenceScore(typeof data.confidence_score === "number" ? data.confidence_score : null);
      setRedFlags(Array.isArray(data.red_flags) ? data.red_flags.map((x) => safeText(x)) : []);
      setPassesLeft(typeof data.passes_left === "number" ? data.passes_left : passesLeft);
      setQuestionIndex(typeof data.question_index === "number" ? data.question_index : questionIndex);
      setTotalQuestions(typeof data.total_questions === "number" ? data.total_questions : totalQuestions);
      setManualAnswer("");
      setLiveTranscript("");
      setPassNotice(true);
      window.setTimeout(() => setPassNotice(false), 5500);

      await speakInterviewer(safeText(data.feedback, "Pass applied."));
      if (data.next_question) {
        await speakInterviewer(safeText(data.next_question));
      }
      startListening();
    } catch (error) {
      console.error("Pass error:", error);
      setFeedback("Pass failed. You may have used all pass rights.");
      startListening();
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  const handleReplayQuestion = async () => {
    if (!avatarRef.current?.isReady()) return;
    setAnswerConfirmOpen(false);
    setPendingAnswerText("");
    stopListening();
    await speakInterviewer(safeText(currentQuestion));
    if (conversationStarted) {
      startListening();
    }
  };

  const handleConfirmSubmit = () => {
    if (processingRef.current || phase !== "listening") return;
    const text =
      pendingAnswerText.trim() ||
      detectorRef.current?.getTranscript().trim() ||
      liveTranscript.trim();
    if (text.length < 8) return;
    detectorRef.current?.submitNow();
  };

  const handleConfirmContinue = () => {
    setAnswerConfirmOpen(false);
    setPendingAnswerText("");
    detectorRef.current?.resumeListening();
  };

  const interviewerActive = isSpeaking || phase === "interviewer_speaking";
  const userActive = phase === "listening" && liveTranscript.trim().length > 0;
  const captionText =
    phase === "processing"
      ? "Evaluating your answer…"
      : phase === "listening"
        ? liveTranscript || "Speak when ready — your words appear here as captions."
        : phase === "interviewer_speaking" || isSpeaking
          ? safeText(currentQuestion)
          : conversationStarted
            ? safeText(currentQuestion)
            : "Join the room to begin your mock interview.";

  return (
    <main className="presence-room fixed inset-0 flex flex-col bg-[#1a1a1a] text-slate-100">
      <header className="presence-header z-30 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#111111]/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
            <p className="presence-header-title truncate text-sm font-semibold">
              {profession} · Mock Interview
            </p>
          </div>
          <p className="presence-header-subtitle mt-0.5 truncate text-xs">{sessionLineForHero}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
          {conversationStarted && (
            <span className="presence-header-chip presence-header-chip-timer rounded-full px-2.5 py-1 font-mono">
              {formatCallDuration(callSeconds)}
            </span>
          )}
          <span className="presence-header-chip rounded-full px-2.5 py-1">
            Q {questionIndex ?? "—"}/{totalQuestions ?? "—"}
          </span>
          <span className="presence-header-chip hidden rounded-full px-2.5 py-1 sm:inline">
            Pass {passesLeft}/3
          </span>
          {hasEvaluation && score != null && (
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-1 text-cyan-100 hover:bg-cyan-500/25"
            >
              Feedback · {score}
            </button>
          )}
          <Link
            href="/dashboard"
            className="presence-header-link hidden rounded-full px-2.5 py-1 sm:inline"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          className={`absolute inset-3 overflow-hidden rounded-2xl border-2 bg-[#0d0d0d] transition-colors duration-200 sm:inset-4 ${
            interviewerActive
              ? "border-[#0b5cff]/70 shadow-[0_0_0_1px_rgba(11,92,255,0.35)]"
              : userActive
                ? "border-emerald-400/50"
                : "border-white/10"
          }`}
        >
          <TalkingHeadAvatar
            ref={avatarRef}
            variant="tile"
            className="relative z-0 h-full"
            onReady={() => setAvatarReady(true)}
            onSpeakingChange={setIsSpeaking}
            onError={(message) => setMicError(message)}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 to-transparent px-4 pb-8 pt-4">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-slate-300" />
              <span className="text-sm font-medium text-white">{INTERVIEWER_NAME}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                Interviewer
              </span>
              {interviewerActive && (
                <span className="rounded-full bg-[#0b5cff]/25 px-2 py-0.5 text-[10px] font-medium text-blue-200">
                  Speaking
                </span>
              )}
          </div>
        </div>

          <PresenceSelfView
            videoRef={videoRef}
            cameraReady={cameraReady}
            cameraError={cameraError}
            active={userActive}
            listening={phase === "listening"}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-4 pb-4 pt-16 sm:px-6">
            <p className="presence-caption-label mb-1 text-[11px] font-semibold uppercase tracking-wider">
              {phase === "listening" ? "Live caption" : "Current question"}
            </p>
            <p className="presence-caption-text max-w-[min(100%,720px)] text-sm leading-relaxed sm:text-base">
              {captionText}
            </p>
          </div>

          {!conversationStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
              <div className="mx-4 max-w-md rounded-2xl border border-white/10 bg-[#141414]/95 p-6 text-center shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/90">
                  Mock Interview Room
                </p>
                <h1 className="mt-2 text-xl font-semibold text-white">
                  {session.isResuming ? "Continue your interview?" : "Ready to join?"}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {hydrating
                    ? "Loading your saved session…"
                    : avatarReady
                      ? session.isResuming
                        ? `Resume at question ${questionIndex ?? "—"} of ${totalQuestions ?? "—"}.`
                        : "Your 3D interviewer is ready. Join to start a face-to-face mock interview — speak naturally and pause when you finish."
                      : "Setting up your interviewer avatar…"}
                </p>
                {hydrationError && (
                  <p className="mt-2 text-xs text-amber-200/90">{hydrationError}</p>
                )}
                {!avatarReady && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-300">
                    <span className="presence-connecting-dot inline-block h-2 w-2 rounded-full bg-blue-400" />
                    Connecting
                  </div>
                )}
              </div>
            </div>
          )}

          {phase === "booting" && conversationStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <div className="rounded-2xl border border-white/10 bg-[#141414]/95 px-6 py-4 text-center">
                <div className="mx-auto mb-3 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="presence-connecting-dot inline-block h-2 w-2 rounded-full bg-blue-400"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-200">Connecting to interview room…</p>
              </div>
            </div>
          )}

          {phase === "processing" && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
              <div className="rounded-2xl border border-violet-400/25 bg-[#141414]/95 px-6 py-4 text-center">
                <p className="text-sm font-medium text-violet-100">Evaluating your answer…</p>
                <p className="mt-1 text-xs text-slate-400">Coach feedback will appear shortly</p>
                    </div>
                  </div>
                )}

          {joinedToast && (
            <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100">
              {INTERVIEWER_NAME} joined the room
                  </div>
                )}

          {passNotice && (
            <div className="absolute left-4 right-4 top-16 z-30 flex items-start gap-3 rounded-xl border border-amber-400/35 bg-amber-500/15 px-4 py-3 text-sm text-amber-50 sm:left-6 sm:right-auto sm:max-w-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
              <div>
                <div className="font-semibold text-amber-100">Question skipped</div>
                <p className="mt-1 text-amber-100/90">Pass recorded.</p>
                    </div>
                  </div>
                )}

          {analysisSuccess && !reviewOpen && (
            <div className="absolute bottom-28 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-50">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              <span>Answer evaluated</span>
                    <button
                      type="button"
                className="ml-1 underline underline-offset-2"
                onClick={() => setReviewOpen(true)}
              >
                View feedback
                    </button>
                  </div>
          )}

          {micError && (
            <div className="absolute left-4 right-4 top-16 z-30 rounded-xl border border-amber-400/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-100 sm:left-6 sm:max-w-md">
              {micError}
                    </div>
                  )}
                </div>
      </div>

      <div
        className={`presence-phase-bar shrink-0 border-t border-white/10 bg-[#111111]/95 px-4 py-2 text-center text-xs ${
          conversationStarted ? "" : "hidden sm:block"
        }`}
      >
        <span className="presence-phase-bar-text inline-flex items-center gap-2">
          {phase === "listening" && <Mic size={12} className="animate-pulse text-emerald-400" />}
          {phaseLabel(phase, answerConfirmOpen)}
        </span>
      </div>

      <PresenceCallControls
        conversationStarted={conversationStarted}
        avatarReady={avatarReady && !hydrating}
        loading={loading}
        isSpeaking={isSpeaking}
        phase={phase}
        showManualInput={showManualInput}
        onJoin={() => void beginConversation()}
        onReplayQuestion={() => void handleReplayQuestion()}
        onPassQuestion={() => void handlePassQuestion()}
        onToggleManualInput={() => setShowManualInput((value) => !value)}
      />

      <PresenceAnswerConfirm
        open={answerConfirmOpen && phase === "listening" && conversationStarted}
        transcript={pendingAnswerText || liveTranscript}
        onSubmit={handleConfirmSubmit}
        onContinue={handleConfirmContinue}
      />

      {showManualInput && conversationStarted && (
        <div className="absolute inset-x-0 bottom-[88px] z-30 mx-auto max-w-2xl px-4 sm:bottom-[92px]">
          <div className="rounded-2xl border border-white/10 bg-[#141414]/98 p-4 shadow-2xl">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="presence-manual-answer">
              Type your answer
            </label>
            <textarea
              id="presence-manual-answer"
              value={manualAnswer}
              onChange={(e) => setManualAnswer(e.target.value)}
              placeholder="Fallback if microphone is unavailable."
              className="textarea min-h-28 w-full border-white/10 bg-[#0d0d0d] text-base leading-relaxed text-slate-100"
              spellCheck
            />
            <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0b5cff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a4fe0] disabled:opacity-50"
                disabled={loading || !manualAnswer.trim()}
                onClick={() => void handleManualSubmit()}
                  >
                    <Send size={16} />
                Submit typed answer
                  </button>
                  <button
                    type="button"
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
                onClick={() => setShowManualInput(false)}
                  >
                Cancel
                  </button>
                </div>
              </div>
            </div>
      )}

      <PresenceReviewDrawer
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
            mode={MODE}
            score={score}
            confidenceScore={confidenceScore}
            feedback={feedback}
            scoreExplanation={scoreExplanation}
            canRetry={canRetry}
            attemptsLeft={attemptsLeft}
            pendingNextQuestion={pendingNextQuestion}
            isSpeaking={isSpeaking}
            strengths={strengths}
            weaknesses={weaknesses}
            suggestions={suggestions}
            redFlags={redFlags}
            onReplayVoice={() => {
          void speakInterviewer(feedback);
            }}
            onContinueNextQuestion={() => {
              if (!pendingNextQuestion) return;
          setReviewOpen(false);
          stopListening();
              setCurrentQuestion(pendingNextQuestion);
              setPendingNextQuestion(null);
              setCanRetry(false);
              setAttemptsLeft(0);
          setManualAnswer("");
          setLiveTranscript("");
              setAnalysisSuccess(false);
              setPassNotice(false);
          void (async () => {
            await speakInterviewer(pendingNextQuestion);
            startListening();
          })();
            }}
          />
    </main>
  );
}

export default function PresenceInterviewPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <PresenceInterviewPageContent />
    </Suspense>
  );
}
