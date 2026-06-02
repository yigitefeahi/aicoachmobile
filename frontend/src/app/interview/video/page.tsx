"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Video,
  Upload,
  Square,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { API_BASE, apiFetch, buildAuthHeaders } from "@/lib/api";
import { speakableText } from "@/lib/safe-text";
import { applyEnglishSpeechVoice } from "@/lib/browser-tts-en";
import { buildSessionContextLine } from "@/lib/question-display";
import { useInterviewSessionHydration } from "@/lib/interview-session-hydration";
import { SessionControlBar } from "@/components/session-control-bar";
import { InterviewQuestionHero } from "@/components/live/interview-question-hero";

type VideoResponse = {
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
  transcript?: string;
  video_analysis?: {
    visual_feedback?: {
      posture?: string;
      eye_contact?: string;
      engagement?: string;
      presentation?: string;
      overall_visual_feedback?: string;
    };
    speaking_metrics?: {
      duration_seconds?: number;
      word_count?: number;
      words_per_minute?: number;
      pace_label?: string;
      pace_comment?: string;
    };
    sampled_frame_count?: number;
    visual_confidence_score?: number;
    visual_signals?: {
      face_detect_ratio?: number;
      eye_contact_ratio?: number;
      stability_score?: number;
      visual_confidence_score?: number;
    };
  };
};

function VideoInterviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id") || "";

  const urlFallback = useMemo(
    () => ({
      profession: searchParams.get("profession") || undefined,
      difficulty: searchParams.get("difficulty") || undefined,
      mode: "video" as const,
      length: searchParams.get("length") || undefined,
      focusArea: searchParams.get("focusArea") || undefined,
      sector: searchParams.get("sector") || undefined,
      company: searchParams.get("company") || undefined,
      companyPack: searchParams.get("companyPack") || undefined,
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
  const sector = session.sector;
  const targetCompany = session.targetCompany;
  const focusArea = session.focusArea;

  const [sessionQuestionContext, setSessionQuestionContext] = useState(
    () => searchParams.get("questionContext") || ""
  );

  const [currentQuestion, setCurrentQuestion] = useState(
    () => searchParams.get("question") || session.currentQuestion
  );
  const [questionRationale, setQuestionRationale] = useState(
    () => searchParams.get("questionRationale") || ""
  );

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("Camera is not active.");
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [visualFeedback, setVisualFeedback] = useState<Record<string, string>>({});
  const [speakingMetrics, setSpeakingMetrics] = useState<Record<string, string | number>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingNextQuestion, setPendingNextQuestion] = useState<string | null>(null);
  const [pendingQuestionRationale, setPendingQuestionRationale] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [passesLeft, setPassesLeft] = useState<number>(3);
  const [questionIndex, setQuestionIndex] = useState<number | null>(1);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(10);
  const [visualSignals, setVisualSignals] = useState<Record<string, number>>({});
  const [clipReadyFlash, setClipReadyFlash] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [passNotice, setPassNotice] = useState(false);

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
  }, [hydrating, session]);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }

      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoURL(url);
        setStatus("Recording completed. Preview is ready.");
        setClipReadyFlash(true);
        window.setTimeout(() => setClipReadyFlash(false), 4000);
      };

      setCameraReady(true);
      setStatus("Camera is active and ready.");
    } catch (error) {
      console.error(error);
      setStatus("Could not access camera or microphone.");
    }
  };

  const startRecording = () => {
    if (!mediaRecorderRef.current) return;
    chunksRef.current = [];
    mediaRecorderRef.current.start();
    setRecording(true);
    setStatus("Recording in progress...");
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const resetAll = () => {
    setVideoURL(null);
    setVideoBlob(null);
    setRecording(false);
    chunksRef.current = [];
    setTranscript("");
    setFeedback("");
    setScore(null);
    setVisualFeedback({});
    setSpeakingMetrics({});
    setPendingNextQuestion(null);
    setCanRetry(false);
    setAttemptsLeft(0);
    setConfidenceScore(null);
    setRedFlags([]);
    setPassesLeft(3);
    setVisualSignals({});
    setClipReadyFlash(false);
    setAnalysisSuccess(false);
    setPassNotice(false);
    setStatus(cameraReady ? "Camera is active and ready." : "Camera is not active.");
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoBlob(file);
    setVideoURL(url);
    setStatus(`Uploaded video: ${file.name}`);
    setClipReadyFlash(true);
    window.setTimeout(() => setClipReadyFlash(false), 4000);
  };

  const handleAnalyze = async () => {
    if (!videoBlob) return;

    try {
      setLoading(true);
      setAnalysisSuccess(false);

      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("video", videoBlob, "answer.webm");

      const res = await apiFetch("/interview/answer/video", {
        method: "POST",
        body: formData,
      });

      const data: VideoResponse = await res.json();
      const qc = typeof data.question_context === "string" ? data.question_context.trim() : "";
      if (qc) {
        setSessionQuestionContext(qc);
      }

      setFeedback(data.feedback || "");
      setScore(data.score ?? null);
      setTranscript(data.transcript || "");
      setVisualFeedback(data.video_analysis?.visual_feedback || {});
      setSpeakingMetrics(data.video_analysis?.speaking_metrics || {});
      setPendingNextQuestion(data.pending_next_question || data.next_question || null);
      const qr =
        typeof data.question_rationale === "string" ? data.question_rationale.trim() : "";
      if (qr) {
        setPendingQuestionRationale(qr);
      }
      setCanRetry(Boolean(data.can_retry));
      setAttemptsLeft(Number(data.attempts_left || 0));
      setConfidenceScore(typeof data.confidence_score === "number" ? data.confidence_score : null);
      setRedFlags(data.red_flags || []);
      setVisualSignals(data.video_analysis?.visual_signals || {});
      setPassesLeft(typeof data.passes_left === "number" ? data.passes_left : passesLeft);
      setQuestionIndex(typeof data.question_index === "number" ? data.question_index : questionIndex);
      setTotalQuestions(typeof data.total_questions === "number" ? data.total_questions : totalQuestions);

      if (data.feedback) {
        await speakFeedback(data.feedback);
      }

      if (data.done) {
        router.push(`/results/${sessionId}`);
        return;
      }

      setAnalysisSuccess(true);
      window.setTimeout(() => setAnalysisSuccess(false), 6000);

      // Let users review feedback before moving to the next question.
    } catch (error) {
      console.error(error);
      setStatus("Video analysis failed.");
    } finally {
      setLoading(false);
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
      const data: VideoResponse = await res.json();
      const qc = typeof data.question_context === "string" ? data.question_context.trim() : "";
      if (qc) {
        setSessionQuestionContext(qc);
      }
      setPassesLeft(typeof data.passes_left === "number" ? data.passes_left : passesLeft);
      setQuestionIndex(typeof data.question_index === "number" ? data.question_index : questionIndex);
      setTotalQuestions(typeof data.total_questions === "number" ? data.total_questions : totalQuestions);
      if (data.done) {
        router.push(`/results/${sessionId}`);
        return;
      }
      if (data.next_question) {
        setCurrentQuestion(data.next_question);
        const qr =
          typeof data.question_rationale === "string" ? data.question_rationale.trim() : "";
        if (qr) {
          setQuestionRationale(qr);
        }
      }
      setAnalysisSuccess(false);
      setPassNotice(true);
      window.setTimeout(() => setPassNotice(false), 5500);
    } catch (error) {
      console.error(error);
      setStatus("Pass failed. You may have used all pass rights.");
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
          mode="video"
          focusArea={focusArea}
          confidence={confidenceScore}
          profession={profession}
          sector={sector}
          targetCompany={targetCompany}
          difficulty={difficulty}
          length={length}
        />
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
            Video Interview
          </p>
          <h1 className="section-title mt-2">Video Practice Studio</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Analyze webcam recordings or uploaded responses with AI coaching.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-secondary">
              Dashboard
            </Link>
            <Link href="/" className="btn-secondary">
              Home
            </Link>
          </div>
        </div>

        <InterviewQuestionHero
          questionText={currentQuestion}
          contextLabel={sessionLineForHero}
          questionRationale={questionRationale || pendingQuestionRationale}
        />

        {(hydrating || hydrationError) && (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              hydrationError
                ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                : "border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            {hydrating ? "Loading saved session progress…" : hydrationError}
          </div>
        )}

        {passNotice && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
            <div>
              <div className="font-semibold text-amber-100">Question skipped (pass used)</div>
              <p className="mt-1 text-amber-100/90">
                Your pass was recorded. Continue when you are ready.
              </p>
            </div>
          </div>
        )}

        {clipReadyFlash && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
            <span>Video ready — you can analyze when you&apos;re set.</span>
          </div>
        )}

        {analysisSuccess && (
          <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
              <span>Successfully received</span>
            </div>
            <div className="flex items-center gap-2 pl-7 text-emerald-100/95">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400/90" aria-hidden />
              <span>Successfully analyzed — feedback is below.</span>
            </div>
          </div>
        )}

        <div className="page-grid">
          <div className="space-y-6">
            <div className="glass panel">
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Live Camera</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Record your answer directly in the browser.
                </p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                <video
                  ref={liveVideoRef}
                  className="aspect-video w-full object-cover"
                  muted
                  playsInline
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={startCamera} className="btn-secondary">
                  <Camera size={16} />
                  Open Camera
                </button>

                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!cameraReady || recording || loading}
                  className="btn-primary"
                >
                  <Video size={16} />
                  Start Recording
                </button>

                <button
                  type="button"
                  onClick={stopRecording}
                  disabled={!recording || loading}
                  className="btn-secondary"
                >
                  <Square size={16} />
                  Stop
                </button>

                <button type="button" onClick={resetAll} className="btn-secondary">
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>
            </div>

            <div className="glass panel">
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Upload Recorded Video</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Upload a saved interview answer for analysis.
                </p>
              </div>

              <label className="flex cursor-pointer items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center hover:bg-white/8">
                <div>
                  <div className="mx-auto mb-3 flex w-fit rounded-2xl bg-white/10 p-3">
                    <Upload size={20} />
                  </div>
                  <div className="font-medium">Click to upload video</div>
                  <div className="mt-1 text-sm text-slate-300">
                    Supports recorded interview answers
                  </div>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="glass panel">
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Preview</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Review your video before sending it for analysis.
                </p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                {videoURL ? (
                  <video src={videoURL} controls className="aspect-video w-full" />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-slate-400">
                    No recorded or uploaded video yet.
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!videoBlob || loading}
                  onClick={handleAnalyze}
                >
                  <Play size={16} />
                  {loading ? "Analyzing..." : "Analyze Video"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={loading}
                  onClick={handlePassQuestion}
                >
                  Pass Question (up to 3/session)
                </button>
              </div>
            </div>
          </div>

          <aside className="glass panel">
            <h2 className="text-xl font-semibold">Video Coach Panel</h2>
            <p className="mt-2 text-sm text-slate-300">
              Transcript, pace metrics and visible presentation feedback.
            </p>

            <div className="mt-6 space-y-4">
              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Status</div>
                <div className="mt-1 font-semibold">{status}</div>
              </div>

              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Score</div>
                <div className="mt-1 font-semibold">{score ?? "-"}</div>
              </div>
              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Confidence</div>
                <div className="mt-1 font-semibold">{confidenceScore ?? "-"}</div>
              </div>

              <div className="card-soft p-4">
                <div className="mb-2 font-medium">Feedback</div>
                <p className="text-sm leading-6 text-slate-300">
                  {feedback || "No feedback yet."}
                </p>

                {feedback && (
                  <div className="mt-4">
                    <button type="button" onClick={() => speakFeedback(feedback)} className="btn-secondary">
                      <Volume2 size={16} />
                      Replay Voice
                    </button>
                  </div>
                )}

                {isSpeaking && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-cyan-300">
                    <span className="animate-pulse">●</span>
                    AI Coach Speaking...
                  </div>
                )}
              </div>

              <div className="card-soft p-4">
                <div className="mb-2 font-medium">Transcript</div>
                <p className="text-sm leading-6 text-slate-300">
                  {transcript || "No transcript yet."}
                </p>
              </div>

              <div className="card-soft p-4">
                <div className="mb-2 font-medium">Visual Feedback</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Posture: {String(visualFeedback.posture || "-")}</li>
                  <li>• Eye contact: {String(visualFeedback.eye_contact || "-")}</li>
                  <li>• Engagement: {String(visualFeedback.engagement || "-")}</li>
                  <li>• Presentation: {String(visualFeedback.presentation || "-")}</li>
                  <li>• Overall: {String(visualFeedback.overall_visual_feedback || "-")}</li>
                </ul>
              </div>

              <div className="card-soft p-4">
                <div className="mb-2 font-medium">Speaking Metrics</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Duration: {String(speakingMetrics.duration_seconds ?? "-")} sec</li>
                  <li>• Word count: {String(speakingMetrics.word_count ?? "-")}</li>
                  <li>• WPM: {String(speakingMetrics.words_per_minute ?? "-")}</li>
                  <li>• Pace: {String(speakingMetrics.pace_label ?? "-")}</li>
                  <li>• Comment: {String(speakingMetrics.pace_comment ?? "-")}</li>
                </ul>
              </div>
              <div className="card-soft p-4">
                <div className="mb-2 font-medium">Vision Signals</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Face detect ratio: {String(visualSignals.face_detect_ratio ?? "-")}</li>
                  <li>• Eye contact ratio: {String(visualSignals.eye_contact_ratio ?? "-")}</li>
                  <li>• Stability score: {String(visualSignals.stability_score ?? "-")}</li>
                  <li>• Visual confidence: {String(visualSignals.visual_confidence_score ?? "-")}</li>
                </ul>
              </div>
              <div className="card-soft p-4">
                <div className="mb-2 font-medium">Red Flags</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {redFlags.length === 0 ? (
                    <li>• No red flags detected.</li>
                  ) : (
                    redFlags.map((item, i) => <li key={i}>• {item.replaceAll("_", " ")}</li>)
                  )}
                </ul>
              </div>

              {(pendingNextQuestion || canRetry) && (
                <div className="card-soft p-4">
                  <div className="mb-2 font-medium">Interview Navigation</div>
                  {canRetry ? (
                    <p className="text-sm text-slate-300">
                      You can retry this question for a stronger answer. Attempts left: {attemptsLeft}.
                    </p>
                  ) : (
                    <p className="text-sm text-slate-300">
                      Ready for the next question. Continue when you are prepared.
                    </p>
                  )}
                  {pendingNextQuestion && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                      Next question preview: {pendingNextQuestion}
                    </div>
                  )}
                  <div className="mt-4 flex gap-3">
                    {canRetry && (
                      <button type="button" className="btn-secondary" onClick={resetAll}>
                        Retry This Question
                      </button>
                    )}
                    {pendingNextQuestion && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setCurrentQuestion(pendingNextQuestion);
                          if (pendingQuestionRationale) {
                            setQuestionRationale(pendingQuestionRationale);
                          }
                          setPendingNextQuestion(null);
                          setPendingQuestionRationale("");
                          setCanRetry(false);
                          setAttemptsLeft(0);
                          resetAll();
                        }}
                      >
                        Continue to Next Question
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function VideoInterviewPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <VideoInterviewPageContent />
    </Suspense>
  );
}