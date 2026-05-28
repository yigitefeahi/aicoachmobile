"use client";

import { useEffect, useMemo, useState } from "react";
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
      (data?.result_json?.turns || []).map((turn, idx) => ({
        name: `Q${idx + 1}`,
        score: turn.score || 0,
      })),
    [data?.result_json?.turns]
  );
  const weakestDimension = useMemo(() => {
    const entries = Object.entries(finalSummary?.scorecard || {}).sort((a, b) => a[1] - b[1]);
    return entries[0]?.[0]?.replaceAll("_", " ") || "the next focused skill";
  }, [finalSummary?.scorecard]);
  const latestAnswer = (data?.result_json?.turns || []).at(-1)?.answer || "";

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

  return (
    <main className="min-h-screen">
      <section className="container py-10">
        <div className="mb-8 rounded-[32px] border border-black/10 bg-white/70 p-6 text-center shadow-sm backdrop-blur">
          <p className="step-label">Results</p>
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
            <button type="button" onClick={downloadReport} className="btn-secondary">
              Export Report
            </button>
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

        <div className="mb-8 rounded-[36px] border border-black/10 bg-white p-8 text-center shadow-[0_24px_70px_rgba(31,41,51,0.08)]">
          <div className="step-label">Final Interview Score</div>
          <div className="mt-2 text-6xl font-extrabold text-white">
            {finalSummary?.score ?? data.result_json.average_score ?? 0}
            <span className="ml-2 text-3xl text-slate-300">/100</span>
          </div>
          <p className="mt-3 text-slate-300">
            Confidence: {report?.confidence_score ?? finalSummary?.confidence_score ?? "-"} • Trend:{" "}
            {report?.benchmark?.trend || "stable"}
          </p>
          {!!finalSummary?.score_explanation && (
            <p className="mx-auto mt-3 max-w-3xl text-sm text-cyan-100">{finalSummary.score_explanation}</p>
          )}
        </div>

        <div className="glass panel mb-8">
          <p className="step-label">Premium Report Summary</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Verdict</div>
              <div className="mt-2 text-lg font-semibold">
                {(finalSummary?.score ?? data.result_json.average_score ?? 0) >= 80
                  ? "Interview-ready"
                  : (finalSummary?.score ?? data.result_json.average_score ?? 0) >= 65
                    ? "Close, needs focused polish"
                    : "Needs more structured practice"}
              </div>
            </div>
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Weakest Dimension</div>
              <div className="mt-2 text-lg font-semibold capitalize">{weakestDimension}</div>
            </div>
            <div className="card-soft p-5">
              <div className="text-sm text-slate-300">Best Next Step</div>
              <div className="mt-2 text-lg font-semibold">Run a focused retry, then save the strongest answer.</div>
            </div>
          </div>
        </div>

        <div className="glass panel mb-8">
          <p className="step-label">Next Best Action</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
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
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="glass panel">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="card-soft p-5">
                <div className="text-sm text-slate-300">Average Score</div>
                <div className="stat-value mt-3">{data.result_json.average_score ?? "-"}</div>
              </div>

              <div className="card-soft p-5">
                <div className="text-sm text-slate-300">Final Score</div>
                <div className="stat-value mt-3">{finalSummary?.score ?? "-"}</div>
              </div>
              <div className="card-soft p-5">
                <div className="text-sm text-slate-300">Evaluation Confidence</div>
                <div className="stat-value mt-3">
                  <ScoreBadge
                    value={report?.confidence_score ?? finalSummary?.confidence_score ?? null}
                    className="text-inherit"
                  />
                </div>
              </div>
              <div className="card-soft p-5">
                <div className="text-sm text-slate-300">Score Trend</div>
                <div className="stat-value mt-3 text-2xl">{report?.benchmark?.trend || "-"}</div>
              </div>
            </div>

            <div className="mt-6 h-[320px] rounded-3xl border border-white/10 bg-white/5 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar dataKey="score" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass panel">
            <div className="card-soft p-5">
              <div className="mb-2 font-semibold">Overall Feedback</div>
              <p className="text-sm leading-6 text-slate-300">
                {finalSummary?.feedback || "No final feedback available."}
              </p>
            </div>

            {finalSummary?.company_rubric?.label && (
              <div className="card-soft mt-4 p-4">
                <div className="mb-2 font-medium">Company Rubric</div>
                <p className="text-sm text-slate-300">
                  {finalSummary.company_rubric.label}:{" "}
                  {(finalSummary.company_rubric.rubric_focus || []).join(", ")}
                </p>
              </div>
            )}

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

            {finalSummary?.scorecard && (
              <div className="card-soft mt-4 p-4">
                <div className="mb-3 font-medium">14-Dimension Scorecard</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(finalSummary.scorecard).map(([key, value]) => (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{key.replaceAll("_", " ")}</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-cyan-500/20" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-1">
              <div className="card-soft p-5">
                <div className="mb-2 font-medium">Strengths</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {(finalSummary?.strengths || []).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="card-soft p-5">
                <div className="mb-2 font-medium">Weaknesses</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {(finalSummary?.weaknesses || []).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="card-soft p-5">
                <div className="mb-2 font-medium">Suggestions</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {(finalSummary?.suggestions || []).map((item, i) => {
                    const support = (finalSummary?.suggestion_citations || []).find(
                      (entry) => String(entry.suggestion || "").trim().toLowerCase() === String(item || "").trim().toLowerCase()
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
                                className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-cyan-100"
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
            </div>
            <div className="card-soft mt-4 p-4">
              <div className="mb-2 font-medium">Recommended Next Steps</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {(finalSummary?.recommended_next_steps || []).map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="card-soft mt-4 p-4">
              <div className="mb-2 font-medium">RAG Evidence (Top Sources)</div>
              <div className="mb-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                <div className="font-semibold">
                  Quality: {finalSummary?.retrieval_quality?.label || "none"}
                  {typeof finalSummary?.retrieval_quality?.score === "number"
                    ? ` (${finalSummary.retrieval_quality.score}/100)`
                    : ""}
                </div>
                <p className="mt-1 text-cyan-100/80">
                  {finalSummary?.rag_summary || "No RAG summary was stored for this session."}
                </p>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                {(finalSummary?.retrieval_evidence || []).slice(0, 4).map((item, i) => (
                  <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="font-medium">
                      {item.source || "unknown"} • {item.doc_type || "knowledge"} • relevance: {item.relevance_label || "n/a"}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      hybrid {item.hybrid_score ?? 0} | semantic {item.semantic_score ?? 0} | keyword{" "}
                      {item.keyword_score ?? 0} | keyword hits {item.keyword_hits ?? 0}
                    </div>
                    {item.preview && <div className="mt-2 text-sm text-slate-300">{item.preview}</div>}
                  </li>
                ))}
              </ul>
              {!!finalSummary?.citations?.length && (
                <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                  <div className="font-semibold">Citation-grounded feedback</div>
                  <ul className="mt-2 space-y-1 text-cyan-100/80">
                    {finalSummary.citations.slice(0, 4).map((citation) => (
                      <li key={citation.id || citation.source}>
                        <button
                          type="button"
                          className="text-left underline decoration-cyan-300/50 underline-offset-2 hover:text-cyan-50"
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
            <div className="card-soft mt-4 p-4">
              <div className="mb-2 font-medium">Quality Flags</div>
              <ul className="space-y-2 text-sm text-rose-200">
                {(report?.red_flags || finalSummary?.red_flags || []).length === 0 ? (
                  <li className="text-slate-300">• No red flags detected in the latest evaluated answer.</li>
                ) : (
                  (report?.red_flags || finalSummary?.red_flags || []).map((item, i) => (
                    <li key={i}>• {item.replaceAll("_", " ")}</li>
                  ))
                )}
              </ul>
            </div>
            <div className="card-soft mt-4 p-4">
              <div className="mb-2 font-medium">Benchmark Snapshot</div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Early average score: {report?.benchmark?.early_average_score ?? "-"}</li>
                <li>• Late average score: {report?.benchmark?.late_average_score ?? "-"}</li>
                <li>• Score delta: {report?.benchmark?.score_delta ?? "-"}</li>
                <li>• Retry attempts used: {report?.benchmark?.retry_attempt_count ?? 0}</li>
              </ul>
            </div>
          </div>
        </div>

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

        <div className="glass panel mt-8">
          <h2 className="text-xl font-semibold">Progress Graph</h2>
          <div className="mt-4 h-[260px] rounded-3xl border border-white/10 bg-white/5 p-4">
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

        <div className="glass panel mt-8">
          <h2 className="text-xl font-semibold">Question / Answer Breakdown</h2>
          <div className="mt-5 space-y-4">
            {(data.result_json.turns || []).map((turn, index) => (
              <div key={index} className="card-soft p-5">
                <div className="text-sm text-cyan-300">Question {index + 1}</div>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                  <div className="font-medium">{turn.question}</div>
                  <button
                    type="button"
                    onClick={() => saveTurnToStoryVault(turn, index)}
                    className="btn-secondary"
                  >
                    Save to Story Vault
                  </button>
                </div>

                <div className="mt-4 text-sm text-slate-300">Answer</div>
                <div className="mt-1 leading-7 text-slate-200">{turn.answer}</div>

                <div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr]">
                  <div className="card-soft p-4">
                    <div className="text-sm text-slate-300">Score</div>
                    <div className="mt-1 text-xl font-bold">{turn.score}</div>
                  </div>

                  <div className="card-soft p-4">
                    <div className="text-sm text-slate-300">Feedback</div>
                    <div className="mt-1 text-sm leading-6 text-slate-200">
                      {turn.feedback}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass panel mt-8">
          <h2 className="text-xl font-semibold">Reference Answers</h2>
          <p className="mt-2 text-sm text-slate-300">
            AI-generated examples of stronger responses for each interview question.
          </p>
          <div className="mt-5 space-y-4">
            {(finalSummary?.reference_answers || []).length === 0 ? (
              <div className="card-soft p-4 text-slate-300">No reference answers available.</div>
            ) : (
              (finalSummary?.reference_answers || []).map((item, index) => (
                <div key={index} className="card-soft p-5">
                  <div className="text-sm text-cyan-300">Question {index + 1}</div>
                  <div className="mt-1 font-medium">{item.question}</div>
                  <div className="mt-3 text-sm text-slate-300">Sample answer</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                    {item.sample_answer}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}