"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  Video,
  Circle,
  MessageSquareText,
} from "lucide-react";
import { apiFetch, API_BASE, buildAuthHeaders } from "@/lib/api";
import { safeText, speakableText } from "@/lib/safe-text";
import { applyEnglishSpeechVoice } from "@/lib/browser-tts-en";
import { buildSessionContextLine } from "@/lib/question-display";
import { SessionControlBar } from "@/components/session-control-bar";
import { SessionStatsCards } from "@/components/live/session-stats-cards";
import { InterviewQuestionHero } from "@/components/live/interview-question-hero";
import { InterviewAnswerPanel } from "@/components/live/interview-answer-panel";
import { CoachPanel } from "@/components/live/coach-panel";

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
  scorecard?: Record<string, number>;
  tone_signals?: Record<string, unknown>;
  company_rubric?: { label?: string; rubric_focus?: string[] };
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  score_explanation?: string;
  rag_summary?: string;
  retrieval_quality?: { label?: string; score?: number };
};

type SpeechResultEventLike = {
  results: ArrayLike<ArrayLike<{ transcript?: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtorLike = new () => SpeechRecognitionLike;

function LiveInterviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessionQuestionContext, setSessionQuestionContext] = useState(
    () => searchParams.get("questionContext") || ""
  );

  const sessionId = searchParams.get("session_id") || "";
  const profession = searchParams.get("profession") || "Frontend Developer";
  const difficulty = searchParams.get("difficulty") || "Junior";
  const mode = searchParams.get("mode") || "text";
  const length = searchParams.get("length") || "10 Questions";
  const focusArea = searchParams.get("focusArea") || "Mixed";
  const sector = searchParams.get("sector") || "";
  const targetCompany = searchParams.get("company") || "";
  const instantMode = searchParams.get("instantMode") === "true";
  const initialQuestion =
    searchParams.get("question") ||
    "Tell me about yourself and why you're interested in this role.";
  const initialQuestionRationale = searchParams.get("questionRationale") || "";

  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [questionRationale, setQuestionRationale] = useState(initialQuestionRationale);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(
    "Your answer will be evaluated here with strengths, weaknesses and suggestions."
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
  const [scorecard, setScorecard] = useState<Record<string, number>>({});
  const [toneSignals, setToneSignals] = useState<Record<string, unknown>>({});
  const [companyRubric, setCompanyRubric] = useState<{ label?: string; rubric_focus?: string[] } | null>(null);
  const [hint, setHint] = useState<{
    hint: string;
    bullets: string[];
    ragSummary?: string;
    retrievalQuality?: { label?: string; score?: number };
    evidence?: Array<{ source?: string; preview?: string; relevance_label?: string; hybrid_score?: number }>;
  } | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const [audioReady, setAudioReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioMimeType, setAudioMimeType] = useState("audio/webm");
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [recordingSavedFlash, setRecordingSavedFlash] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [passNotice, setPassNotice] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push("/interview/setup");
    }
  }, [sessionId, router]);

  const icon = useMemo(() => {
    if (mode === "audio") return <Mic size={20} />;
    if (mode === "video") return <Video size={20} />;
    return <MessageSquareText size={20} />;
  }, [mode]);

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

  const speakFeedback = async (text: unknown) => {
    const plain = speakableText(text);
    const fallbackSpeak = () => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }
      const utterance = new SpeechSynthesisUtterance(plain);
      applyEnglishSpeechVoice(utterance);
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    try {
      setIsSpeaking(true);

      const res = await fetch(
        `${API_BASE}/tts?text=${encodeURIComponent(plain.slice(0, 4096))}`,
        {
          method: "POST",
          credentials: "include",
          headers: buildAuthHeaders(),
        }
      );

      if (!res.ok) {
        fallbackSpeak();
        return;
      }

      const data = await res.json();

      if (!data?.audio_base64) {
        fallbackSpeak();
        return;
      }

      const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);

      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);

      await audio.play();
    } catch {
      fallbackSpeak();
    }
  };

  const applyResponse = async (data: SubmitResponse) => {
    const qc = typeof data.question_context === "string" ? data.question_context.trim() : "";
    if (qc) {
      setSessionQuestionContext(qc);
    }
    setFeedback(safeText(data.feedback, "Feedback unavailable."));
    setScore(data.score ?? null);
    setScoreExplanation(safeText(data.score_explanation));
    setStrengths(
      Array.isArray(data.strengths) ? data.strengths.map((x) => safeText(x)) : []
    );
    setWeaknesses(
      Array.isArray(data.weaknesses) ? data.weaknesses.map((x) => safeText(x)) : []
    );
    setSuggestions(
      Array.isArray(data.suggestions) ? data.suggestions.map((x) => safeText(x)) : []
    );
    setCanRetry(Boolean(data.can_retry));
    setAttemptsLeft(Number(data.attempts_left || 0));
    setPendingNextQuestion(
      data.pending_next_question != null ? safeText(data.pending_next_question) : null
    );
    setConfidenceScore(
      typeof data.confidence_score === "number" ? data.confidence_score : null
    );
    setRedFlags(
      Array.isArray(data.red_flags) ? data.red_flags.map((x) => safeText(x)) : []
    );
    setPassesLeft(typeof data.passes_left === "number" ? data.passes_left : passesLeft);
    setQuestionIndex(typeof data.question_index === "number" ? data.question_index : questionIndex);
    setTotalQuestions(typeof data.total_questions === "number" ? data.total_questions : totalQuestions);

    setScorecard(data.scorecard || data.sub_scores || {});
    setToneSignals(data.tone_signals || {});
    setCompanyRubric(data.company_rubric || null);

    const qr =
      typeof data.question_rationale === "string" ? data.question_rationale.trim() : "";
    if (qr) {
      setQuestionRationale(qr);
    }

    if (!instantMode) {
      await speakFeedback(data.feedback as unknown);
    }

    if (data.done) {
      router.push(`/results/${sessionId}`);
      return;
    }

    setAnswer("");
    setRecordedBlob(null);
    setHint(null);
  };

  const handleHint = async () => {
    try {
      setHintLoading(true);
      const res = await apiFetch("/interview/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: Number(sessionId) }),
      });
      const data = await res.json();
      setHint({
        hint: safeText(data.hint, "Start with a clear structure and one measurable result."),
        bullets: Array.isArray(data.bullets) ? data.bullets.map((x: unknown) => safeText(x)) : [],
        ragSummary: safeText(data.rag_summary),
        retrievalQuality:
          data.retrieval_quality && typeof data.retrieval_quality === "object"
            ? (data.retrieval_quality as { label?: string; score?: number })
            : undefined,
        evidence: Array.isArray(data.retrieval_evidence) ? data.retrieval_evidence : [],
      });
    } catch {
      setHint({ hint: "Use STAR: context, action, result, and one metric.", bullets: [] });
    } finally {
      setHintLoading(false);
    }
  };

  const handlePassQuestion = async () => {
    try {
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
      setScoreExplanation(safeText(data.score_explanation));
      setConfidenceScore(typeof data.confidence_score === "number" ? data.confidence_score : null);
      setRedFlags(
        Array.isArray(data.red_flags) ? data.red_flags.map((x) => safeText(x)) : []
      );
      setPassesLeft(typeof data.passes_left === "number" ? data.passes_left : passesLeft);
      setQuestionIndex(typeof data.question_index === "number" ? data.question_index : questionIndex);
      setTotalQuestions(typeof data.total_questions === "number" ? data.total_questions : totalQuestions);
      setAnswer("");
      setRecordedBlob(null);
      setSpeechTranscript("");
      setHint(null);
      setAnalysisSuccess(false);
      setPassNotice(true);
      window.setTimeout(() => setPassNotice(false), 5500);
    } catch (error) {
      console.error("Pass error:", error);
      setFeedback("Pass failed. You may have used all pass rights.");
    } finally {
      setLoading(false);
    }
  };

  const submitTextAnswer = async () => {
    const res = await apiFetch("/interview/answer/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: Number(sessionId), answer_text: answer }),
    });

    return res.json();
  };

  const startAudioRecording = async () => {
    try {
      const speechWindow = window as Window & {
        SpeechRecognition?: SpeechRecognitionCtorLike;
        webkitSpeechRecognition?: SpeechRecognitionCtorLike;
      };
      const SpeechRecognitionCtor =
        speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = (event: SpeechResultEventLike) => {
          let text = "";
          for (let i = 0; i < event.results.length; i += 1) {
            text += event.results[i][0]?.transcript || "";
            text += " ";
          }
          setSpeechTranscript(text.trim());
        };
        recognitionRef.current = recognition;
        recognition.start();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/mpeg",
      ];
      const chosenMime =
        candidates.find((m) => MediaRecorder.isTypeSupported(m)) || "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: chosenMime });

      chunksRef.current = [];
      mediaRecorderRef.current = recorder;
      setAudioMimeType(chosenMime);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chosenMime });
        if (blob.size < 1500) {
          setFeedback("Recording is too short or empty. Please record at least 2-3 seconds.");
          setRecordedBlob(null);
        } else {
          setRecordedBlob(blob);
          setRecordingSavedFlash(true);
          window.setTimeout(() => setRecordingSavedFlash(false), 3500);
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(250);
      setRecording(true);
      setAudioReady(true);
    } catch (error) {
      console.error(error);
    }
  };

  const stopAudioRecording = () => {
    mediaRecorderRef.current?.stop();
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore speech recognition stop errors
    }
    setRecording(false);
  };

  const submitAudioAnswer = async () => {
    if (speechTranscript.trim()) {
      const res = await apiFetch("/interview/answer/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: Number(sessionId),
          answer_text: speechTranscript.trim(),
        }),
      });
      return res.json();
    }

    if (!recordedBlob) return null;

    const filename = audioMimeType.includes("mp4")
      ? "answer.m4a"
      : audioMimeType.includes("mpeg")
      ? "answer.mp3"
      : "answer.webm";

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("audio", recordedBlob, filename);

    const res = await apiFetch("/interview/answer/audio", {
      method: "POST",
      body: formData,
    });

    return res.json();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setAnalysisSuccess(false);

      let data: SubmitResponse | null = null;

      if (mode === "text" || mode === "case") {
        if (!answer.trim()) return;
        data = await submitTextAnswer();
      } else if (mode === "audio") {
        data = await submitAudioAnswer();
        if (!data) return;
      }

      if (data) {
        const willCompleteSession = Boolean(data.done);
        await applyResponse(data);
        if (!willCompleteSession) {
          setAnalysisSuccess(true);
          window.setTimeout(() => setAnalysisSuccess(false), 6000);
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      setFeedback("An error occurred while submitting your answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <section className="container py-10">
        <SessionControlBar
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
          passesLeft={passesLeft}
          retriesLeft={attemptsLeft}
          mode={mode}
          focusArea={focusArea}
          confidence={confidenceScore}
          profession={profession}
          sector={sector}
          targetCompany={targetCompany}
          difficulty={difficulty}
          length={length}
        />
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
              Live Interview
            </p>
            <h1 className="section-title mt-2">{profession} Mock Interview</h1>
            <p className="mt-3 text-slate-400">
              Details are summarized in the session bar above.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="btn-secondary">
              Dashboard
            </Link>
            <Link href="/" className="btn-secondary">
              Home
            </Link>
            <div className="glass flex items-center gap-3 rounded-full px-4 py-3">
              <Circle size={12} className="fill-emerald-400 text-emerald-400" />
              <span className="text-sm font-medium">Session Active</span>
            </div>
          </div>
        </div>
        <SessionStatsCards attemptsLeft={attemptsLeft} passesLeft={passesLeft} />

        <InterviewQuestionHero
          questionText={safeText(currentQuestion)}
          contextLabel={sessionLineForHero}
          questionRationale={questionRationale}
        />

        <div className="page-grid">
          <InterviewAnswerPanel
            icon={icon}
            currentQuestion={currentQuestion}
            mode={mode}
            answer={answer}
            loading={loading}
            recording={recording}
            audioReady={audioReady}
            speechTranscript={speechTranscript}
            recordedBlob={recordedBlob}
            sessionId={sessionId}
            profession={profession}
            difficulty={difficulty}
            length={length}
            focusArea={focusArea}
            recordingSavedFlash={recordingSavedFlash}
            analysisSuccess={analysisSuccess}
            passNotice={passNotice}
            questionVariant="hero"
            onAnswerChange={setAnswer}
            onStartRecording={startAudioRecording}
            onStopRecording={stopAudioRecording}
            onSubmit={handleSubmit}
            onClear={() => {
              setAnswer("");
              setRecordedBlob(null);
              setSpeechTranscript("");
            }}
            onPassQuestion={handlePassQuestion}
            onAskHint={handleHint}
            hint={hint}
            hintLoading={hintLoading}
          />

          <CoachPanel
            mode={mode}
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
            scorecard={scorecard}
            toneSignals={toneSignals}
            companyRubric={companyRubric}
            onReplayVoice={() => {
              void speakFeedback(feedback);
            }}
            onContinueNextQuestion={() => {
              if (!pendingNextQuestion) return;
              setCurrentQuestion(pendingNextQuestion);
              setPendingNextQuestion(null);
              setCanRetry(false);
              setAttemptsLeft(0);
              setAnswer("");
              setRecordedBlob(null);
              setSpeechTranscript("");
              setAnalysisSuccess(false);
              setPassNotice(false);
            }}
          />
        </div>
      </section>
    </main>
  );
}

export default function LiveInterviewPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <LiveInterviewPageContent />
    </Suspense>
  );
}