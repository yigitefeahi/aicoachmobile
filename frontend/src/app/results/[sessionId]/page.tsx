"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ScoreBadge } from "@/components/score-badge";
import { RagInspectorPanel, type RagInspectorData } from "@/components/rag-inspector-panel";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type SessionResponse = {
  session_id: number;
  profession: string;
  created_at: string;
  result_json: {
    average_score?: number;
    final_summary?: {
      score?: number;
      sub_scores?: Record<string, number>;
      scorecard?: Record<string, number>;
      tone_signals?: Record<string, unknown>;
      company_rubric?: { label?: string; rubric_focus?: string[] };
      strengths?: string[];
      weaknesses?: string[];
      suggestions?: string[];
      suggestion_citations?: Array<{
        suggestion?: string;
        citation_ids?: string[];
        reason?: string;
        support_level?: string;
      }>;
      recommended_next_steps?: string[];
      retrieval_evidence?: Array<{
        source?: string;
        hybrid_score?: number;
        semantic_score?: number;
        keyword_score?: number;
        relevance_label?: string;
        preview?: string;
        keyword_hits?: number;
        doc_type?: string;
      }>;
      rag_summary?: string;
      retrieval_quality?: { label?: string; score?: number; evidence_count?: number; source_count?: number };
      citations?: Array<{ id?: string; source?: string; layer?: string; doc_type?: string; claim?: string; score?: number }>;
      citation_notes?: string[];
      rag_evaluation?: Record<string, unknown>;
      feedback?: string;
      score_explanation?: string;
      confidence_score?: number;
      red_flags?: string[];
      reference_answers?: Array<{ question: string; sample_answer: string }>;
    };
    turns?: Array<{
      question: string;
      answer: string;
      score: number;
      feedback: string;
    }>;
  } | null;
};

type SessionReport = {
  confidence_score?: number;
  red_flags?: string[];
  benchmark?: {
    early_average_score?: number | null;
    late_average_score?: number | null;
    score_delta?: number | null;
    trend?: string;
    retry_attempt_count?: number;
  };
};

type ReliabilityResult = {
  reliability?: {
    runs?: number;
    mean_score?: number;
    min_score?: number;
    max_score?: number;
    std_dev?: number;
    consistency_percent?: number;
    consistency_label?: string;
    scores?: number[];
  };
};

type RagCompareResult = {
  preferred_mode?: "rag" | "no_rag";
  score_delta?: number;
  confidence_delta?: number;
  with_rag?: {
    score?: number;
    confidence_score?: number;
    score_explanation?: string;
  };
  without_rag?: {
    score?: number;
    confidence_score?: number;
    score_explanation?: string;
  };
};

type RagEvalSession = {
  retrieval_precision?: number;
  coverage?: number;
  faithfulness?: number;
  answer_grounding?: number;
  citation_support_rate?: number;
  retrieval_quality?: { label?: string; score?: number };
  low_confidence?: boolean;
  rag_vs_no_rag?: {
    status?: string;
    detail?: string;
    score_delta?: number | null;
    confidence_delta?: number | null;
    preferred_mode?: "rag" | "no_rag";
  };
  evidence_count?: number;
};

type RagEvalTrend = {
  status?: string;
  sample_size?: number;
  averages?: {
    retrieval_precision?: number;
    coverage?: number;
    faithfulness?: number;
    citation_support_rate?: number;
  };
  low_confidence_rate?: number | null;
};

type ScorecardExtreme = { key: string; label: string; value: number };

function formatDimension(key: string): string {
  return key.replaceAll("_", " ");
}

function scorecardExtremes(scorecard: Record<string, number> | undefined): {
  weakest: ScorecardExtreme | null;
  strongest: ScorecardExtreme | null;
} {
  const entries = Object.entries(scorecard || {}).filter(([, value]) => typeof value === "number");
  if (!entries.length) {
    return { weakest: null, strongest: null };
  }
  const sorted = [...entries].sort((a, b) => a[1] - b[1]);
  const [weakestKey, weakestValue] = sorted[0];
  const [strongestKey, strongestValue] = sorted[sorted.length - 1];
  return {
    weakest: { key: weakestKey, label: formatDimension(weakestKey), value: weakestValue },
    strongest: { key: strongestKey, label: formatDimension(strongestKey), value: strongestValue },
  };
}

function buildVerdict(score: number): string {
  if (score >= 80) return "Interview-ready";
  if (score >= 65) return "Close — needs focused polish";
  return "Needs more structured practice";
}

function buildWeakestAreaNote(input: {
  weakest: ScorecardExtreme | null;
  overallScore: number;
  weaknesses?: string[];
}): string {
  const firstWeakness = input.weaknesses?.[0]?.trim();
  if (firstWeakness) return firstWeakness;

  const key = input.weakest?.key || "";
  const value = input.weakest?.value ?? 0;
  const highOverall = input.overallScore >= 70;

  if (key === "conciseness") {
    return highOverall
      ? "Answers are technically strong in places, but some responses could be shorter and more focused."
      : "Several answers ran long or lost focus before landing the main point.";
  }
  if (key === "metrics") {
    return "Include expected improvement targets and before/after outcomes, not only metric names.";
  }
  if (key === "tradeoffs") {
    return "Explain what alternative you rejected, why you chose your path, and what you measured.";
  }
  if (key === "structure") {
    return "Use a clearer opening, middle, and close so the interviewer can follow your story quickly.";
  }
  if (key === "impact") {
    return "Connect your actions to business or user outcomes with at least one concrete result.";
  }
  if (value <= 25 && highOverall) {
    return `Relative to your other strengths, ${input.weakest?.label || "this area"} has the most room to improve.`;
  }
  return `Focus your next practice pass on ${input.weakest?.label || "structure, examples, and measurable outcomes"}.`;
}

const RETRY_CHECKLIST = [
  "Did I answer the actual question?",
  "Did I use a clear structure?",
  "Did I mention one trade-off?",
  "Did I include one metric or target?",
  "Did I connect the answer to business impact?",
  "Can I say it in under 2 minutes?",
];

const IMPROVEMENT_THEME_DEFAULTS = [
  {
    id: "conciseness",
    title: "Conciseness",
    detail: "Answers are strong in places but should be shorter and more focused.",
    keywords: ["concis", "short", "length", "long", "wordy", "brief"],
  },
  {
    id: "tradeoffs",
    title: "Trade-off clarity",
    detail: "Explain what alternative you rejected and why your chosen path was better.",
    keywords: ["trade", "tradeoff", "trade-off", "alternative", "versus", " vs "],
  },
  {
    id: "metrics",
    title: "Metric targets",
    detail: "Include expected improvement targets, not only metric names.",
    keywords: ["metric", "measure", "quant", "number", "impact", "outcome", "kpi"],
  },
];

function buildTopImprovementThemes(
  suggestions: string[] | undefined,
  weaknesses: string[] | undefined,
  weakestKey: string | undefined
): Array<{ title: string; detail: string }> {
  const corpus = [...(suggestions || []), ...(weaknesses || [])].join(" ").toLowerCase();
  const themes: Array<{ title: string; detail: string }> = [];

  for (const theme of IMPROVEMENT_THEME_DEFAULTS) {
    const matchedSuggestion = (suggestions || []).find((item) =>
      theme.keywords.some((keyword) => item.toLowerCase().includes(keyword))
    );
    if (matchedSuggestion || theme.keywords.some((keyword) => corpus.includes(keyword)) || weakestKey === theme.id) {
      themes.push({
        title: theme.title,
        detail: matchedSuggestion || theme.detail,
      });
    }
    if (themes.length >= 3) break;
  }

  if (themes.length < 3) {
    for (const theme of IMPROVEMENT_THEME_DEFAULTS) {
      if (themes.some((entry) => entry.title === theme.title)) continue;
      themes.push({ title: theme.title, detail: theme.detail });
      if (themes.length >= 3) break;
    }
  }

  return themes.slice(0, 3);
}

function buildCompanyRubricBullets(rubric: { label?: string; rubric_focus?: string[] } | undefined): {
  heading: string;
  bullets: string[];
} | null {
  if (!rubric?.label) return null;
  const focusItems = (rubric.rubric_focus || []).map((item) => item.trim()).filter(Boolean);
  const bullets = focusItems.length > 0 ? focusItems : ["Role-specific evaluation signals for this company pack."];
  return {
    heading: `Company Rubric Focus — ${rubric.label}`,
    bullets,
  };
}

const SEVEN_DAY_PLAN_TARGET =
  "Target: answer each question in under 2 minutes with one structure, one trade-off, one metric, and one business impact.";

function buildSevenDayPlan(profession: string, weakestLabel: string) {
  const role = profession.trim().toLowerCase();
  const focus = weakestLabel || "structure and impact";

  if (role.includes("ai engineer") || role.includes("machine learning") || role.includes("ml engineer")) {
    return [
      {
        day: 1,
        title: "90-second system design answer",
        detail: "Practice one AI system design answer with data flow, latency, and fallback rules.",
      },
      {
        day: 2,
        title: "ML model design story",
        detail: "Prepare one story covering problem framing, model choice, validation, and deployment trade-offs.",
      },
      {
        day: 3,
        title: "Trade-off decision example",
        detail: "Prepare one answer where you chose between model quality, latency, cost, or interpretability.",
      },
      {
        day: 4,
        title: "Metrics and business impact",
        detail: `Add precision/recall, latency, cost, or revenue impact to one weak answer. Focus on ${focus}.`,
      },
      {
        day: 5,
        title: "Three AI Engineer mock answers",
        detail: "Write three short answers for model design, ML ops, and production failure handling.",
      },
      {
        day: 6,
        title: "Spoken rehearsal with timer",
        detail: "Practice aloud under 2 minutes per answer with one metric and one trade-off each.",
      },
      {
        day: 7,
        title: "Final retry and score comparison",
        detail: "Run a shorter mock session and compare scores with this report.",
      },
    ];
  }

  if (role.includes("product manager") || role.includes("product management")) {
    return [
      {
        day: 1,
        title: "STAR product story",
        detail: "Write one product decision story with user problem, options, decision, and outcome.",
      },
      {
        day: 2,
        title: "Prioritization example",
        detail: "Prepare one answer explaining what you cut, what you shipped, and why.",
      },
      {
        day: 3,
        title: "Trade-off decision example",
        detail: "Prepare one answer balancing user experience, speed, and business cost.",
      },
      {
        day: 4,
        title: "Metrics and impact",
        detail: `Add success metrics, guardrails, and business impact to one weak answer. Focus on ${focus}.`,
      },
      {
        day: 5,
        title: "Three PM mock answers",
        detail: "Practice product sense, execution, and stakeholder conflict answers.",
      },
      {
        day: 6,
        title: "Spoken rehearsal with timer",
        detail: "Practice aloud with a timer and aim for crisp structure without rambling.",
      },
      {
        day: 7,
        title: "Final retry and score comparison",
        detail: "Run a shorter mock session and compare scores with this report.",
      },
    ];
  }

  if (role.includes("software") || role.includes("backend") || role.includes("frontend") || role.includes("full stack")) {
    return [
      {
        day: 1,
        title: "Structured technical story",
        detail: `Practice one ${profession} answer with context, approach, trade-offs, and result.`,
      },
      {
        day: 2,
        title: "System or implementation example",
        detail: "Prepare one answer covering architecture, failure modes, and operational impact.",
      },
      {
        day: 3,
        title: "Trade-off decision example",
        detail: "Prepare one answer comparing two technical options and why you chose one.",
      },
      {
        day: 4,
        title: "Metrics and impact",
        detail: `Add latency, reliability, cost, or quality metrics to one weak answer. Focus on ${focus}.`,
      },
      {
        day: 5,
        title: "Three technical mock answers",
        detail: "Write three short answers for debugging, design, and ownership scenarios.",
      },
      {
        day: 6,
        title: "Spoken rehearsal with timer",
        detail: "Practice aloud under 2 minutes with one metric and one trade-off each.",
      },
      {
        day: 7,
        title: "Final retry and score comparison",
        detail: "Run a shorter mock session and compare scores with this report.",
      },
    ];
  }

  return [
    {
      day: 1,
      title: "STAR format practice",
      detail: `Write one ${profession} story using Situation, Task, Action, Result. Keep each section to 2–3 sentences.`,
    },
    {
      day: 2,
      title: "Risk management example",
      detail: "Prepare one answer about identifying risk early, mitigating it, and communicating trade-offs to stakeholders.",
    },
    {
      day: 3,
      title: "Trade-off decision example",
      detail: "Prepare one answer where you chose between speed, quality, and scope — explain why and what you measured.",
    },
    {
      day: 4,
      title: "Metrics and impact",
      detail: `Revise one weak answer by adding measurable outcomes. Focus especially on ${focus}.`,
    },
    {
      day: 5,
      title: "Three mock answers",
      detail: `Write three short written answers (90–120 seconds each) for common ${profession} questions.`,
    },
    {
      day: 6,
      title: "Spoken rehearsal",
      detail: "Practice aloud with a timer. Aim for clear structure, fewer fillers, and one metric per story.",
    },
    {
      day: 7,
      title: "Final retry and comparison",
      detail: "Run a shorter mock session, compare scores with this report, and save your strongest answer to Story Vault.",
    },
  ];
}

function truncateToSentences(text: string, maxSentences: number): { preview: string; hasMore: boolean } {
  const trimmed = text.trim();
  if (!trimmed) return { preview: "", hasMore: false };
  const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [trimmed];
  const preview = sentences.slice(0, maxSentences).join(" ").trim();
  return { preview, hasMore: sentences.length > maxSentences };
}

function questionsMatch(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  const leftSlice = left.slice(0, 60);
  const rightSlice = right.slice(0, 60);
  return left.includes(rightSlice) || right.includes(leftSlice);
}

function getReferenceAnswer(
  references: Array<{ question: string; sample_answer: string }> | undefined,
  question: string,
  index: number
): string | null {
  if (!references?.length) return null;
  const byIndex = references[index];
  if (byIndex && questionsMatch(byIndex.question, question)) {
    return byIndex.sample_answer;
  }
  const matched = references.find((item) => questionsMatch(item.question, question));
  return matched?.sample_answer ?? null;
}

function computeBestScore(
  turns: Array<{ score: number }>,
  fallbackScore?: number | null
): number {
  const scores = turns.map((turn) => turn.score).filter((score) => typeof score === "number");
  if (scores.length === 0) {
    return typeof fallbackScore === "number" ? fallbackScore : 0;
  }
  return Math.max(...scores);
}

function buildScoreInterpretation(input: {
  bestScore: number | null;
  averageScore: number | null;
  trend?: string;
  toneSignals?: Record<string, unknown>;
}): string[] {
  const notes: string[] = [];
  const { bestScore, averageScore, trend, toneSignals } = input;

  if (bestScore != null && averageScore != null) {
    if (bestScore > averageScore) {
      notes.push(
        `Your best answer scored ${bestScore - averageScore} points above your session average — you had at least one strong answer in this session.`
      );
    } else {
      notes.push("Your best score matched your session average — performance was consistent across answers.");
    }
  }

  if (trend === "improving") {
    notes.push("Score trend is improving: later answers were stronger than earlier ones.");
  } else if (trend === "declining") {
    notes.push("Score trend declined across the session — fatigue or harder questions may have affected later answers.");
  } else if (trend === "stable") {
    notes.push("Score trend stayed relatively stable across the session.");
  }

  const concision = String(toneSignals?.concision || toneSignals?.conciseness || "").toLowerCase();
  if (concision.includes("high") && bestScore != null && bestScore < 65) {
    notes.push(
      "Conciseness may look strong, but your best score is still low — answers likely need more relevant examples, structure, and measurable outcomes."
    );
  }

  return notes;
}

function ReportSection({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass panel mb-8 ${className}`}>
      <p className="step-label">{title}</p>
      {subtitle && <p className="mt-2 text-sm text-slate-300">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ResultsPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [data, setData] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SessionReport | null>(null);
  const [reliability, setReliability] = useState<ReliabilityResult | null>(null);
  const [ragCompare, setRagCompare] = useState<RagCompareResult | null>(null);
  const [ragInspector, setRagInspector] = useState<RagInspectorData | null>(null);
  const [highlightedCitationId, setHighlightedCitationId] = useState<string | null>(null);
  const [ragEval, setRagEval] = useState<RagEvalSession | null>(null);
  const [ragTrend, setRagTrend] = useState<RagEvalTrend | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [ragEvalLoading, setRagEvalLoading] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/interview/session/${sessionId}`);
        const json = await res.json();
        setData(json);
        const repRes = await apiFetch(`/interview/session/${sessionId}/report`);
        const repJson = await repRes.json();
        setReport(repJson);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not load results");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const finalSummary = data?.result_json?.final_summary;
  const turns = data?.result_json?.turns || [];
  const turnCount = turns.length;

  const averageScore = data?.result_json?.average_score ?? null;
  const bestScore = useMemo(
    () => computeBestScore(turns, finalSummary?.score ?? averageScore),
    [turns, finalSummary?.score, averageScore]
  );
  const confidenceScore = report?.confidence_score ?? finalSummary?.confidence_score ?? null;
  const trend = report?.benchmark?.trend || "stable";

  const { weakest, strongest } = useMemo(
    () => scorecardExtremes(finalSummary?.scorecard),
    [finalSummary?.scorecard]
  );

  const weakestLabel = weakest?.label || "structure and measurable impact";
  const strongestLabel = strongest?.label || "communication clarity";
  const weakestAreaNote = useMemo(
    () =>
      buildWeakestAreaNote({
        weakest,
        overallScore: bestScore,
        weaknesses: finalSummary?.weaknesses,
      }),
    [weakest, bestScore, finalSummary?.weaknesses]
  );
  const topImprovementThemes = useMemo(
    () => buildTopImprovementThemes(finalSummary?.suggestions, finalSummary?.weaknesses, weakest?.key),
    [finalSummary?.suggestions, finalSummary?.weaknesses, weakest?.key]
  );
  const companyRubricDisplay = useMemo(
    () => buildCompanyRubricBullets(finalSummary?.company_rubric),
    [finalSummary?.company_rubric]
  );
  const criticalImprovement =
    finalSummary?.weaknesses?.[0] || `Strengthen ${weakestLabel} with concrete examples and outcomes.`;
  const nextAction =
    finalSummary?.recommended_next_steps?.[0] ||
    `Run a focused retry on ${weakestLabel}, then save your strongest answer.`;

  const radarData = useMemo(() => {
    const sub = finalSummary?.sub_scores || {};
    const scorecard = finalSummary?.scorecard || {};
    return [
      { subject: "Clarity", score: scorecard.clarity || sub.clarity || 0 },
      { subject: "Structure", score: scorecard.structure || sub.structure || 0 },
      { subject: "Impact", score: scorecard.impact || 0 },
      { subject: "Metrics", score: scorecard.metrics || 0 },
      { subject: "Technical", score: scorecard.technical_depth || sub.technical_depth || 0 },
      { subject: "Confidence", score: scorecard.confidence || sub.confidence || 0 },
    ];
  }, [finalSummary]);

  const progressData = useMemo(
    () =>
      turns.map((turn, idx) => ({
        name: `Q${idx + 1}`,
        score: turn.score || 0,
      })),
    [turns]
  );

  const scoreInterpretation = useMemo(
    () =>
      buildScoreInterpretation({
        bestScore: turns.length > 0 ? bestScore : null,
        averageScore: typeof averageScore === "number" ? averageScore : null,
        trend,
        toneSignals: finalSummary?.tone_signals,
      }),
    [turns.length, bestScore, averageScore, trend, finalSummary?.tone_signals]
  );

  const sevenDayPlan = useMemo(
    () => buildSevenDayPlan(data?.profession || "Interview", weakestLabel),
    [data?.profession, weakestLabel]
  );

  const latestAnswer = turns.at(-1)?.answer || "";

  const runAdvancedAnalysis = async () => {
    if (!latestAnswer) return;
    try {
      setAnalysisLoading(true);
      const [relRes, cmpRes] = await Promise.all([
        apiFetch("/interview/evaluate/reliability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: Number(sessionId),
            answer_text: latestAnswer,
            runs: 3,
          }),
        }),
        apiFetch("/interview/evaluate/rag-compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: Number(sessionId),
            answer_text: latestAnswer,
          }),
        }),
      ]);
      setReliability(await relRes.json());
      setRagCompare(await cmpRes.json());
    } catch (e) {
      console.error("advanced analysis failed", e);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const loadRagEvaluation = async (includeCompare = false) => {
    try {
      setRagEvalLoading(true);
      const [sessionRes, trendRes] = await Promise.all([
        apiFetch(`/rag/eval/session/${sessionId}?include_compare=${includeCompare ? "true" : "false"}`),
        apiFetch("/rag/eval/trend?sample_size=20"),
      ]);
      setRagEval(await sessionRes.json());
      setRagTrend(await trendRes.json());
    } catch (e) {
      console.error("rag evaluation failed", e);
    } finally {
      setRagEvalLoading(false);
    }
  };

  const loadRagInspector = async (turnIndex?: number, phase?: string) => {
    try {
      setInspectorLoading(true);
      const params = new URLSearchParams();
      if (turnIndex) params.set("turn_index", String(turnIndex));
      if (phase) params.set("phase", phase);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const res = await apiFetch(`/rag/inspector/session/${sessionId}${suffix}`);
      setRagInspector(await res.json());
    } catch (e) {
      console.error("rag inspector failed", e);
    } finally {
      setInspectorLoading(false);
    }
  };

  const focusCitation = (citationId: string) => {
    setHighlightedCitationId(citationId);
    if (!ragInspector) {
      void loadRagInspector().then(() => {
        window.setTimeout(() => {
          document.getElementById(`rag-evidence-${citationId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 400);
      });
      return;
    }
    document.getElementById(`rag-evidence-${citationId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const downloadReport = async () => {
    try {
      const res = await apiFetch(`/interview/session/${sessionId}/report`);
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview-report-session-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("report download failed", e);
    }
  };

  const saveTurnToStoryVault = async (turn: { question: string; answer: string; score: number }, index: number) => {
    await apiFetch("/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: Number(sessionId),
        title: `${data?.profession || "Interview"} story Q${index + 1}`,
        tags: [data?.profession || "interview", "saved-answer"],
        question: turn.question,
        answer: turn.answer,
        score: turn.score,
      }),
    });
    setSaveNotice(`Question ${index + 1} saved to Story Vault.`);
    window.setTimeout(() => setSaveNotice(null), 3500);
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <section className="container py-10">
          <div className="mx-auto max-w-4xl">
            <div className="skeleton h-48" />
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="skeleton h-28" />
              <div className="skeleton h-28" />
              <div className="skeleton h-28" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !data || !data.result_json) {
    return (
      <main className="min-h-screen">
        <section className="container py-10">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-red-200">
            {error || "No result data found."}
          </div>
        </section>
      </main>
    );
  }

  const referenceAnswers = finalSummary?.reference_answers || [];
  const redFlags = report?.red_flags || finalSummary?.red_flags || [];

  return (
    <main className="premium-report min-h-screen">
      <section className="container py-10">
        <div className="no-print mb-8 rounded-[32px] border border-black/10 bg-white/70 p-6 text-center shadow-sm backdrop-blur">
          <p className="step-label">Premium Interview Report</p>
          <h1 className="section-title mx-auto mt-3 max-w-4xl">{data.profession} Session Results</h1>
          <p className="mt-4 text-slate-300">
            Session #{data.session_id} • {new Date(data.created_at).toLocaleString()}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="btn-secondary">
              Dashboard
            </Link>
            <Link href="/" className="btn-secondary">
              Home
            </Link>
            <button type="button" onClick={() => window.print()} className="btn-primary">
              Export PDF
            </button>
          </div>
          {saveNotice && (
            <div className="mx-auto mt-4 max-w-md rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {saveNotice}
            </div>
          )}
        </div>

        {/* 1. Executive Summary */}
        <ReportSection
          title="Executive Summary"
          subtitle={`${turnCount} question${turnCount === 1 ? "" : "s"} completed. Read this first, then review the question breakdown and practice plan below.`}
        >
          <div className="rounded-[28px] border border-black/10 bg-white p-6 text-center shadow-sm">
            <div className="text-sm text-slate-300">Your Best Score</div>
            <div className="mt-2 text-5xl font-extrabold">
              {bestScore}
              <span className="ml-2 text-2xl text-slate-300">/100</span>
            </div>
            <p className="mx-auto mt-3 max-w-3xl text-xs leading-5 text-slate-400">
              Your highest score on a single question in this session.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Verdict</div>
              <div className="mt-2 text-lg font-semibold">{buildVerdict(bestScore)}</div>
            </div>
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Strongest Area</div>
              <div className="mt-2 text-lg font-semibold capitalize">{strongestLabel}</div>
              {strongest && (
                <p className="mt-1 text-xs text-slate-400">Relative score: {strongest.value}/100</p>
              )}
            </div>
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Weakest Area</div>
              <div className="mt-2 text-lg font-semibold capitalize">{weakestLabel}</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                <span className="font-medium text-slate-200">Note:</span> {weakestAreaNote}
              </p>
              {weakest && (
                <p className="mt-2 text-xs text-slate-400">Relative score: {weakest.value}/100</p>
              )}
            </div>
            <div className="card-soft p-5 md:col-span-2 xl:col-span-2">
              <div className="text-sm text-slate-300">Most Critical Improvement</div>
              <div className="mt-2 text-base leading-6">{criticalImprovement}</div>
            </div>
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Best Next Action</div>
              <div className="mt-2 text-base leading-6">{nextAction}</div>
            </div>
          </div>

          {!!finalSummary?.feedback && (
            <div className="card-soft mt-4 p-5">
              <div className="mb-2 font-semibold">Coach Summary</div>
              <p className="text-sm leading-6 text-slate-300">{finalSummary.feedback}</p>
            </div>
          )}
        </ReportSection>

        {/* 2. Score explanations + scorecard */}
        <ReportSection
          title="Scorecard and Key Takeaways"
          subtitle="What the numbers mean, where you performed best, and what to improve next."
          className="report-page-break"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Your Best Score</div>
              <div className="stat-value mt-2">{bestScore}</div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Your highest score on a single answered question in this session.
              </p>
            </div>
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Average Score</div>
              <div className="stat-value mt-2">{averageScore ?? "-"}</div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                The mean score across all answered questions in this session.
              </p>
            </div>
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Evaluation Confidence</div>
              <div className="stat-value mt-2">
                <ScoreBadge value={confidenceScore} className="text-inherit" />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                How confident the evaluator was based on answer clarity, specificity, and evidence density.
              </p>
            </div>
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Score Trend</div>
              <div className="stat-value mt-2 text-2xl capitalize">{trend}</div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Performance difference between earlier questions and later questions in this session.
              </p>
            </div>
          </div>

          <div className="card-soft mt-4 p-4">
            <div className="mb-2 font-medium">How to read these scores</div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Your Best Score is your highest single-question result; Average Score reflects the full session.</li>
              <li>• Evaluation Confidence shows how much evidence the evaluator had to work with.</li>
              <li>• Score Trend shows whether you improved, declined, or stayed steady across questions.</li>
            </ul>
          </div>

          {!!finalSummary?.score_explanation && (
            <div className="card-soft mt-4 p-4">
              <div className="mb-2 font-medium">Latest Answer Note</div>
              <p className="text-sm leading-6 text-slate-300">{finalSummary.score_explanation}</p>
            </div>
          )}

          {scoreInterpretation.length > 0 && (
            <div className="card-soft mt-4 p-4">
              <div className="mb-2 font-medium">Score Notes</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {scoreInterpretation.map((note, index) => (
                  <li key={index}>• {note}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="h-[280px] rounded-3xl border border-white/10 bg-white/5 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar dataKey="score" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[280px] rounded-3xl border border-white/10 bg-white/5 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {finalSummary?.scorecard && (
            <div className="card-soft mt-4 p-4">
              <div className="mb-3 font-medium">Dimension Scorecard</div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(finalSummary.scorecard).map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="capitalize">{formatDimension(key)}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-500/20"
                        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="card-soft p-5">
              <div className="mb-2 font-medium">Key Strengths</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {(finalSummary?.strengths || []).length === 0 ? (
                  <li>• No major strengths highlighted yet.</li>
                ) : (
                  (finalSummary?.strengths || []).slice(0, 5).map((item, i) => <li key={i}>• {item}</li>)
                )}
              </ul>
            </div>
            <div className="card-soft p-5">
              <div className="mb-2 font-medium">Key Weaknesses</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {(finalSummary?.weaknesses || []).length === 0 ? (
                  <li>• No major weaknesses highlighted yet.</li>
                ) : (
                  (finalSummary?.weaknesses || []).slice(0, 5).map((item, i) => <li key={i}>• {item}</li>)
                )}
              </ul>
            </div>
          </div>

          {topImprovementThemes.length > 0 && (
            <div className="card-soft mt-4 p-5">
              <div className="mb-2 font-medium">Top Improvement Themes</div>
              <ul className="space-y-3 text-sm text-slate-300">
                {topImprovementThemes.map((theme) => (
                  <li key={theme.title}>
                    <span className="font-medium text-slate-200">{theme.title}:</span> {theme.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {companyRubricDisplay && (
            <div className="card-soft mt-4 p-4">
              <div className="mb-3 font-medium">{companyRubricDisplay.heading}</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {companyRubricDisplay.bullets.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card-soft mt-4 p-4">
            <div className="mb-2 font-medium">Quality Flags</div>
            <ul className="space-y-2 text-sm text-slate-300">
              {redFlags.length === 0 ? (
                <li>• No major quality flags detected.</li>
              ) : (
                redFlags.map((item, i) => <li key={i}>• {item.replaceAll("_", " ")}</li>)
              )}
            </ul>
          </div>
        </ReportSection>

        {/* 3. Question breakdown */}
        <ReportSection
          title="Question-by-Question Feedback"
          subtitle="Each section shows the key feedback first. Expand only when you need the full evaluation."
          className="report-page-break"
        >
          <div className="space-y-4">
            {turns.map((turn, index) => {
              const { preview, hasMore } = truncateToSentences(turn.feedback || "", 3);
              const sampleAnswer = getReferenceAnswer(referenceAnswers, turn.question, index);

              return (
                <div key={index} className="card-soft p-5">
                  <div className="text-sm text-cyan-300">Question {index + 1}</div>
                  <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                    <div className="font-medium">{turn.question}</div>
                    <button type="button" onClick={() => saveTurnToStoryVault(turn, index)} className="btn-secondary no-print">
                      Save to Story Vault
                    </button>
                  </div>

                  <div className="mt-4 text-sm text-slate-300">Your Answer</div>
                  <div className="mt-1 leading-7 text-slate-200">{turn.answer}</div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr]">
                    <div className="card-soft p-4">
                      <div className="text-sm text-slate-300">Score</div>
                      <div className="mt-1 text-xl font-bold">{turn.score}</div>
                    </div>
                    <div className="card-soft p-4">
                      <div className="text-sm text-slate-300">Key Feedback</div>
                      <div className="mt-1 text-sm leading-6 text-slate-200">{preview || "No feedback available."}</div>
                      {hasMore && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium text-cyan-200">Show full feedback</summary>
                          <div className="mt-2 text-sm leading-6 text-slate-200">{turn.feedback}</div>
                        </details>
                      )}
                    </div>
                  </div>

                  {sampleAnswer && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-medium text-slate-200">Stronger Example Answer</div>
                      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{sampleAnswer}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ReportSection>

        {/* 5. 7-day plan */}
        <ReportSection
          title="7-Day Improvement Plan"
          subtitle="A practical sequence to turn this report into stronger interview answers."
          className="report-page-break"
        >
          <div className="space-y-3">
            {sevenDayPlan.map((item) => (
              <div key={item.day} className="card-soft p-4">
                <div className="font-semibold">
                  Day {item.day}: {item.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="card-soft mt-6 border border-cyan-400/20 bg-cyan-500/5 p-5">
            <p className="text-sm font-medium leading-6 text-slate-200">{SEVEN_DAY_PLAN_TARGET}</p>
          </div>

          <div className="no-print mt-6 grid gap-4 md:grid-cols-3">
            <a href="/roadmap" className="card-soft p-4">
              <div className="font-semibold">Convert this into a plan</div>
              <p className="mt-2 text-sm text-slate-300">Use the scorecard to guide weekly drills.</p>
            </a>
            <a href="/stories" className="card-soft p-4">
              <div className="font-semibold">Save stronger stories</div>
              <p className="mt-2 text-sm text-slate-300">Turn high-signal answers into reusable STAR examples.</p>
            </a>
            <a href="/interview/setup" className="card-soft p-4">
              <div className="font-semibold">Run a focused retry</div>
              <p className="mt-2 text-sm text-slate-300">Practice the weakest dimension with a shorter session.</p>
            </a>
          </div>
        </ReportSection>

        <ReportSection
          title="Retry Checklist"
          subtitle="Before your next mock interview, use this quick self-check."
          className="report-page-break"
        >
          <div className="card-soft p-5">
            <div className="mb-3 font-medium">Before your next retry</div>
            <ul className="space-y-2 text-sm text-slate-300">
              {RETRY_CHECKLIST.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </ReportSection>

        {/* 6. Technical Appendix */}
        <details className="technical-appendix glass panel mb-8">
          <summary className="cursor-pointer list-none p-6">
            <p className="step-label">Technical Appendix</p>
            <h2 className="mt-2 text-xl font-semibold">Evidence Trace, RAG Debug, and Developer Export</h2>
            <p className="mt-2 text-sm text-slate-300">
              Optional technical details for QA, demo, or engineering review. Hidden from the main coach report by default.
            </p>
          </summary>

          <div className="border-t border-white/10 p-6 pt-0">
            <div className="no-print mb-4">
              <button type="button" onClick={downloadReport} className="btn-secondary">
                Developer Export (JSON)
              </button>
            </div>

            <div className="card-soft p-4">
              <div className="mb-2 font-medium">Recommended Next Steps (Full List)</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {(finalSummary?.recommended_next_steps || []).map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            {finalSummary?.tone_signals && (
              <div className="card-soft mt-4 p-4">
                <div className="mb-2 font-medium">Tone Detection</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Summary: {String(finalSummary.tone_signals.summary || "-")}</li>
                  <li>
                    • Fillers: {String(finalSummary.tone_signals.filler_count ?? "-")} · Hedging:{" "}
                    {String(finalSummary.tone_signals.hedging_count ?? "-")}
                  </li>
                  <li>
                    • Concision: {String(finalSummary.tone_signals.concision ?? "-")} · Confidence signal:{" "}
                    {String(finalSummary.tone_signals.confidence_signal ?? "-")}
                  </li>
                </ul>
              </div>
            )}

            <div className="card-soft mt-4 p-4">
              <div className="mb-2 font-medium">Benchmark Snapshot</div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Early average score: {report?.benchmark?.early_average_score ?? "-"}</li>
                <li>• Late average score: {report?.benchmark?.late_average_score ?? "-"}</li>
                <li>• Score delta: {report?.benchmark?.score_delta ?? "-"}</li>
                <li>• Retry attempts used: {report?.benchmark?.retry_attempt_count ?? 0}</li>
              </ul>
            </div>

            <div className="card-soft mt-4 p-4">
              <div className="mb-2 font-medium">RAG Evidence (Top Sources)</div>
              <div className="appendix-callout mb-3 rounded-xl p-3 text-sm">
                <div className="font-semibold">
                  Quality: {finalSummary?.retrieval_quality?.label || "none"}
                  {typeof finalSummary?.retrieval_quality?.score === "number"
                    ? ` (${finalSummary.retrieval_quality.score}/100)`
                    : ""}
                </div>
                <p className="mt-1 leading-6">
                  {finalSummary?.rag_summary || "No RAG summary was stored for this session."}
                </p>
              </div>
              <ul className="space-y-3 text-sm">
                {(finalSummary?.retrieval_evidence || []).slice(0, 4).map((item, i) => (
                  <li key={i} className="appendix-callout rounded-xl p-3">
                    <div className="font-medium">
                      {item.source || "unknown"} • {item.doc_type || "knowledge"} • relevance: {item.relevance_label || "n/a"}
                    </div>
                    <div className="mt-1 text-xs opacity-80">
                      hybrid {item.hybrid_score ?? 0} | semantic {item.semantic_score ?? 0} | keyword{" "}
                      {item.keyword_score ?? 0} | keyword hits {item.keyword_hits ?? 0}
                    </div>
                    {item.preview && <div className="mt-2 text-sm">{item.preview}</div>}
                  </li>
                ))}
              </ul>
              {!!finalSummary?.citations?.length && (
                <div className="appendix-callout mt-4 rounded-xl p-3 text-sm">
                  <div className="font-semibold">Citation-grounded feedback</div>
                  <ul className="mt-2 space-y-2">
                    {finalSummary.citations.slice(0, 4).map((citation) => (
                      <li key={citation.id || citation.source}>
                        <button
                          type="button"
                          className="text-left leading-6 underline underline-offset-2 hover:opacity-80"
                          onClick={() => citation.id && focusCitation(citation.id)}
                        >
                          {citation.id}: {citation.doc_type} · {citation.source} · {citation.claim}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {(finalSummary?.suggestions || []).length > 0 && (
              <div className="card-soft mt-4 p-4">
                <div className="mb-2 font-medium">Suggestions with Evidence Links</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {(finalSummary?.suggestions || []).map((item, i) => {
                    const support = (finalSummary?.suggestion_citations || []).find(
                      (entry) =>
                        String(entry.suggestion || "").trim().toLowerCase() === String(item || "").trim().toLowerCase()
                    );
                    return (
                      <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div>• {item}</div>
                        {!!support?.citation_ids?.length && (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {support.citation_ids.map((cid) => (
                              <button
                                key={`${item}-${cid}`}
                                type="button"
                                onClick={() => focusCitation(cid)}
                                className="rounded-full border border-black/20 bg-white px-2 py-1 hover:bg-[#f7f3ed]"
                              >
                                {cid}
                              </button>
                            ))}
                            {support.support_level && (
                              <span className="rounded-full border border-white/20 px-2 py-1 text-slate-300">
                                support: {support.support_level}
                              </span>
                            )}
                          </div>
                        )}
                        {!!support?.reason && <div className="mt-1 text-xs text-slate-400">{support.reason}</div>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="glass panel mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Evaluation Reliability and RAG Comparison</h2>
                <button
                  type="button"
                  onClick={runAdvancedAnalysis}
                  className="btn-secondary"
                  disabled={analysisLoading || !latestAnswer}
                >
                  {analysisLoading ? "Analyzing..." : "Run Analysis on Latest Answer"}
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="card-soft p-4">
                  <div className="font-medium">Reliability (same answer, multiple scorings)</div>
                  {!reliability?.reliability ? (
                    <p className="mt-2 text-sm text-slate-300">Run analysis to compute consistency.</p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      <li>• Scores: {(reliability.reliability.scores || []).join(", ")}</li>
                      <li>• Mean: {reliability.reliability.mean_score ?? "-"}</li>
                      <li>• Std dev: {reliability.reliability.std_dev ?? "-"}</li>
                      <li>
                        • Consistency:{" "}
                        <span className="font-semibold">{reliability.reliability.consistency_percent ?? "-"}</span>% (
                        {reliability.reliability.consistency_label || "unknown"})
                      </li>
                    </ul>
                  )}
                </div>
                <div className="card-soft p-4">
                  <div className="font-medium">RAG vs No-RAG</div>
                  {!ragCompare ? (
                    <p className="mt-2 text-sm text-slate-300">Run analysis to compare both modes.</p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      <li>• Preferred mode: {ragCompare.preferred_mode || "-"}</li>
                      <li>• Score delta (RAG - No-RAG): {ragCompare.score_delta ?? "-"}</li>
                      <li>• Confidence delta: {ragCompare.confidence_delta ?? "-"}</li>
                      <li>• With RAG score: {ragCompare.with_rag?.score ?? "-"}</li>
                      <li>• Without RAG score: {ragCompare.without_rag?.score ?? "-"}</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="glass panel mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">RAG Scorecard (Quality Evaluation)</h2>
                <button
                  type="button"
                  onClick={() => loadRagEvaluation(true)}
                  className="btn-secondary"
                  disabled={ragEvalLoading}
                >
                  {ragEvalLoading ? "Loading..." : "Load RAG Evaluation"}
                </button>
              </div>
              {!ragEval ? (
                <p className="text-sm text-slate-300">
                  Evaluate retrieval precision, coverage, faithfulness, citation support, and low-confidence risk.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="card-soft p-4">
                    <div className="font-medium">Session Quality</div>
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      <li>• Retrieval precision: {Math.round((ragEval.retrieval_precision || 0) * 100)}%</li>
                      <li>• Coverage: {Math.round((ragEval.coverage || 0) * 100)}%</li>
                      <li>• Faithfulness: {Math.round((ragEval.faithfulness || 0) * 100)}%</li>
                      <li>• Citation support: {Math.round((ragEval.citation_support_rate || 0) * 100)}%</li>
                      <li>• Low confidence: {ragEval.low_confidence ? "yes" : "no"}</li>
                      <li>• Evidence chunks: {ragEval.evidence_count ?? 0}</li>
                    </ul>
                  </div>
                  <div className="card-soft p-4">
                    <div className="font-medium">RAG vs No-RAG and Trend</div>
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      <li>• Compare status: {ragEval.rag_vs_no_rag?.status || "not_run"}</li>
                      <li>• Preferred mode: {ragEval.rag_vs_no_rag?.preferred_mode || "-"}</li>
                      <li>• Score delta: {ragEval.rag_vs_no_rag?.score_delta ?? "-"}</li>
                      <li>• Confidence delta: {ragEval.rag_vs_no_rag?.confidence_delta ?? "-"}</li>
                      <li>• Trend sample size: {ragTrend?.sample_size ?? 0}</li>
                      <li>
                        • Trend low confidence rate:{" "}
                        {typeof ragTrend?.low_confidence_rate === "number"
                          ? `${Math.round(ragTrend.low_confidence_rate * 100)}%`
                          : "-"}
                      </li>
                    </ul>
                    {ragEval.rag_vs_no_rag?.detail && (
                      <p className="mt-3 text-xs text-slate-400">{ragEval.rag_vs_no_rag.detail}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="glass panel mt-8">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="step-label">RAG Inspector</p>
                  <h2 className="mt-2 text-xl font-semibold">Retrieval Debug and Evidence Trace</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Shows query context, layer coverage, graph hits, user memory, and retrieval quality for defense/demo.
                  </p>
                </div>
                <button type="button" onClick={() => void loadRagInspector()} className="btn-secondary" disabled={inspectorLoading}>
                  {inspectorLoading ? "Loading..." : "Open Inspector"}
                </button>
              </div>
              <div className="appendix-readable">
              <RagInspectorPanel
                sessionId={sessionId}
                inspector={ragInspector}
                loading={inspectorLoading}
                onLoad={loadRagInspector}
                onUpdate={setRagInspector}
                highlightedCitationId={highlightedCitationId}
                onCitationHighlight={setHighlightedCitationId}
              />
              </div>
            </div>
          </div>
        </details>
      </section>
    </main>
  );
}
