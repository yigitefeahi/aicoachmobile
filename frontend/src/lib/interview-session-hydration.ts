"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export const MAX_PASSES_PER_SESSION = 3;

export const DEFAULT_INTERVIEW_QUESTION =
  "Tell me about yourself and why you're interested in this role.";

/** Mirror backend `target_question_count()` for UI hydration. */
export function targetQuestionCount(interviewLength: string): number {
  const value = interviewLength.toLowerCase().trim();
  if (value.includes("15")) return 15;
  if (value.includes("5")) return 5;
  if (value.includes("10")) return 10;
  if (value.includes("20 minute")) return 6;
  if (value.includes("30 minute")) return 8;
  return 5;
}

export type InterviewSessionUrlFallback = {
  profession?: string;
  difficulty?: string;
  mode?: string;
  length?: string;
  focusArea?: string;
  sector?: string;
  company?: string;
  companyPack?: string;
  instantMode?: boolean;
  interviewDate?: string;
  caseType?: string;
  question?: string;
  questionRationale?: string;
  questionContext?: string;
};

export type HydratedInterviewSession = {
  profession: string;
  difficulty: string;
  mode: string;
  length: string;
  focusArea: string;
  sector: string;
  targetCompany: string;
  companyPack: string;
  instantMode: boolean;
  interviewDate: string;
  caseType: string;
  currentQuestion: string;
  questionRationale: string;
  questionContext: string;
  questionIndex: number;
  totalQuestions: number;
  passesLeft: number;
  answeredCount: number;
  isResuming: boolean;
  isCompleted: boolean;
};

type SessionApiResponse = {
  session_id: number;
  profession: string;
  result_json?: Record<string, unknown> | null;
};

export function buildHydratedFromUrl(
  fallback: InterviewSessionUrlFallback
): HydratedInterviewSession {
  const length = fallback.length || "10 Questions";
  return {
    profession: fallback.profession || "Frontend Developer",
    difficulty: fallback.difficulty || "Junior",
    mode: fallback.mode || "text",
    length,
    focusArea: fallback.focusArea || "Mixed",
    sector: fallback.sector || "",
    targetCompany: fallback.company || "",
    companyPack: fallback.companyPack || "general",
    instantMode: Boolean(fallback.instantMode),
    interviewDate: fallback.interviewDate || "",
    caseType: fallback.caseType || "",
    currentQuestion: fallback.question || DEFAULT_INTERVIEW_QUESTION,
    questionRationale: fallback.questionRationale || "",
    questionContext: fallback.questionContext || "",
    questionIndex: 1,
    totalQuestions: targetQuestionCount(length),
    passesLeft: MAX_PASSES_PER_SESSION,
    answeredCount: 0,
    isResuming: false,
    isCompleted: false,
  };
}

export function parseInterviewSessionApi(
  data: SessionApiResponse,
  fallback: InterviewSessionUrlFallback
): HydratedInterviewSession {
  const base = buildHydratedFromUrl(fallback);
  const resultJson = data.result_json || {};
  const config = (resultJson.config || {}) as Record<string, unknown>;
  const turns = Array.isArray(resultJson.turns) ? resultJson.turns : [];
  const answeredCount = turns.length;
  const length =
    String(config.interview_length || fallback.length || "10 Questions").trim() ||
    "10 Questions";
  const totalQuestions = targetQuestionCount(length);
  const passesUsed = Number(resultJson.passes_used ?? 0);
  const passesLeft = Math.max(0, MAX_PASSES_PER_SESSION - passesUsed);
  const status = String(resultJson.status || "");
  const isCompleted = status === "completed";
  const currentQuestion =
    String(resultJson.current_question || "").trim() ||
    fallback.question ||
    DEFAULT_INTERVIEW_QUESTION;
  const questionContext =
    String(resultJson.question_context || "").trim() || fallback.questionContext || "";
  const questionRationale =
    String(resultJson.question_rationale || "").trim() || fallback.questionRationale || "";

  return {
    profession: data.profession || base.profession,
    difficulty: String(config.difficulty || fallback.difficulty || base.difficulty),
    mode: String(config.mode || fallback.mode || base.mode),
    length,
    focusArea: String(config.focus_area || fallback.focusArea || base.focusArea),
    sector: String(config.sector || fallback.sector || base.sector),
    targetCompany: String(config.target_company || fallback.company || base.targetCompany),
    companyPack: String(config.company_pack || fallback.companyPack || base.companyPack),
    instantMode: Boolean(config.instant_mode ?? fallback.instantMode),
    interviewDate: String(config.interview_date || fallback.interviewDate || ""),
    caseType: String(config.case_type || fallback.caseType || ""),
    currentQuestion,
    questionRationale,
    questionContext,
    questionIndex: isCompleted ? Math.max(1, answeredCount) : answeredCount + 1,
    totalQuestions,
    passesLeft,
    answeredCount,
    isResuming: answeredCount > 0,
    isCompleted,
  };
}

export function useInterviewSessionHydration(
  sessionId: string,
  urlFallback: InterviewSessionUrlFallback
) {
  const router = useRouter();
  const fallbackRef = useRef(urlFallback);
  fallbackRef.current = urlFallback;
  const [session, setSession] = useState<HydratedInterviewSession>(() =>
    buildHydratedFromUrl(urlFallback)
  );
  const [hydrating, setHydrating] = useState(Boolean(sessionId));
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setHydrating(false);
      return;
    }

    let cancelled = false;
    setHydrating(true);
    setHydrationError(null);

    void (async () => {
      try {
        const res = await apiFetch(`/interview/session/${encodeURIComponent(sessionId)}`);
        if (!res.ok) {
          throw new Error("Session not found");
        }

        const data = (await res.json()) as SessionApiResponse;
        if (cancelled) return;

        const parsed = parseInterviewSessionApi(data, fallbackRef.current);
        if (parsed.isCompleted) {
          router.replace(`/results/${sessionId}`);
          return;
        }

        setSession(parsed);
      } catch {
        if (!cancelled) {
          setHydrationError("Could not load saved session progress. Using link defaults.");
          setSession(buildHydratedFromUrl(fallbackRef.current));
        }
      } finally {
        if (!cancelled) {
          setHydrating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return { session, hydrating, hydrationError };
}
