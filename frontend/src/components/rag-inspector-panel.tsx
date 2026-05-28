"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

export type RagEvidenceItem = {
  source?: string;
  layer?: string;
  doc_type?: string;
  hybrid_score?: number;
  semantic_score?: number;
  keyword_score?: number;
  metadata_score?: number;
  layer_weight?: number;
  relevance_label?: string;
  preview?: string;
  selection_reason?: string;
  matched_filter?: Record<string, string>;
  expanded_from_graph?: boolean;
};

export type RagInspectorData = {
  selected_turn_index?: number | null;
  selected_phase?: string;
  turn_traces?: Array<{ turn_index?: number; phase?: string; question?: string }>;
  query_debug?: Record<string, unknown>;
  query_trace?: {
    primary_query?: string;
    query_variants?: string[];
    candidate_filters?: Array<Record<string, string>>;
    routes?: Array<{ collection?: string; layer?: string; weight?: number }>;
    top_k_scores?: Array<Record<string, unknown>>;
    k?: number;
  };
  answer_rag?: {
    evidence?: RagEvidenceItem[];
    query_trace?: RagInspectorData["query_trace"];
    rag_summary?: string;
    retrieval_quality?: { label?: string; score?: number };
    citations?: Array<{ id?: string; source?: string; claim?: string }>;
  };
  question_rag?: {
    evidence?: RagEvidenceItem[];
    query_trace?: RagInspectorData["query_trace"];
    rag_summary?: string;
    retrieval_quality?: { label?: string; score?: number };
  };
  retrieval_quality?: { label?: string; score?: number };
  retrieval_evaluation?: Record<string, unknown>;
  rag_confidence?: { score?: number; quality_label?: string; quality_score?: number; low_confidence?: boolean };
  rag_summary?: string;
  evidence?: RagEvidenceItem[];
  citations?: Array<{ id?: string; source?: string; claim?: string }>;
  graph_hits?: Array<{ source?: string; relation?: string; target?: string; overlap?: number }>;
  graph_paths?: Array<{
    path_label?: string;
    kb_chunks?: Array<{ source?: string; preview?: string; hybrid_score?: number }>;
  }>;
  user_graph_edges?: Array<{ source?: string; relation?: string; target?: string }>;
  user_memory?: Array<{ memory_type?: string; content?: string }>;
  low_confidence_warning?: boolean;
};

type RagInspectorPanelProps = {
  sessionId: string;
  inspector: RagInspectorData | null;
  loading: boolean;
  onLoad: (turnIndex?: number, phase?: string) => Promise<void>;
  onUpdate: (data: RagInspectorData) => void;
  highlightedCitationId?: string | null;
  onCitationHighlight?: (citationId: string | null) => void;
};

function ScoreBar({ label, value }: { label: string; value?: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, Number(value || 0))) * 100);
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/10">
        <div className="h-1.5 rounded-full bg-cyan-400/80" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function RagInspectorPanel({
  sessionId,
  inspector,
  loading,
  onLoad,
  onUpdate,
  highlightedCitationId,
  onCitationHighlight,
}: RagInspectorPanelProps) {
  const [phase, setPhase] = useState<"answer_evaluation" | "question_generation">("answer_evaluation");
  const [turnIndex, setTurnIndex] = useState<number | "">("");
  const [rerunLoading, setRerunLoading] = useState(false);

  const activeEvidence = useMemo(() => {
    if (!inspector) return [];
    if (phase === "question_generation") {
      return inspector.question_rag?.evidence || [];
    }
    return inspector.answer_rag?.evidence || inspector.evidence || [];
  }, [inspector, phase]);

  const activeTrace = useMemo(() => {
    if (!inspector) return {};
    if (phase === "question_generation") {
      return inspector.question_rag?.query_trace || {};
    }
    return inspector.query_trace || inspector.answer_rag?.query_trace || {};
  }, [inspector, phase]);

  const handleRerun = async () => {
    try {
      setRerunLoading(true);
      const res = await apiFetch(`/rag/inspector/session/${sessionId}/rerun`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turn_index: turnIndex === "" ? undefined : Number(turnIndex),
          phase,
        }),
      });
      const rerun = await res.json();
      if (!inspector) return;
      const merged: RagInspectorData = {
        ...inspector,
        evidence: rerun.evidence || [],
        query_trace: rerun.query_trace || {},
        rag_summary: rerun.rag_summary || inspector.rag_summary,
        retrieval_quality: rerun.retrieval_quality || inspector.retrieval_quality,
        retrieval_evaluation: rerun.rag_evaluation || inspector.retrieval_evaluation,
        ...(phase === "question_generation"
          ? {
              question_rag: {
                ...(inspector.question_rag || {}),
                evidence: rerun.evidence || [],
                query_trace: rerun.query_trace || {},
                rag_summary: rerun.rag_summary,
                retrieval_quality: rerun.retrieval_quality,
              },
            }
          : {
              answer_rag: {
                ...(inspector.answer_rag || {}),
                evidence: rerun.evidence || [],
                query_trace: rerun.query_trace || {},
                rag_summary: rerun.rag_summary,
                retrieval_quality: rerun.retrieval_quality,
              },
            }),
      };
      onUpdate(merged);
    } finally {
      setRerunLoading(false);
    }
  };

  const exportInspector = () => {
    if (!inspector) return;
    const blob = new Blob([JSON.stringify(inspector, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rag-inspector-session-${sessionId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!inspector) {
    return (
      <p className="text-sm text-slate-300">
        Open the inspector to see query trace, filters, score breakdown, and selection reasons.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          value={phase}
          onChange={(event) =>
            setPhase(event.target.value as "answer_evaluation" | "question_generation")
          }
        >
          <option value="answer_evaluation">Answer RAG</option>
          <option value="question_generation">Question RAG</option>
        </select>
        <select
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          value={turnIndex}
          onChange={(event) =>
            setTurnIndex(event.target.value ? Number(event.target.value) : "")
          }
        >
          <option value="">Latest turn</option>
          {(inspector.turn_traces || []).map((trace) => (
            <option key={`${trace.phase}-${trace.turn_index}`} value={trace.turn_index}>
              Turn {trace.turn_index} · {trace.phase}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-secondary"
          disabled={loading}
          onClick={() =>
            void onLoad(turnIndex === "" ? undefined : Number(turnIndex), phase)
          }
        >
          {loading ? "Loading..." : "Load Trace"}
        </button>
        <button type="button" className="btn-secondary" disabled={rerunLoading} onClick={() => void handleRerun()}>
          {rerunLoading ? "Re-running..." : "Re-run Retrieval"}
        </button>
        <button type="button" className="btn-secondary" onClick={exportInspector}>
          Export JSON
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-soft p-4">
          <div className="font-medium">RAG Confidence</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            <li>• Quality: {inspector.retrieval_quality?.label || inspector.rag_confidence?.quality_label || "-"} ({inspector.retrieval_quality?.score ?? inspector.rag_confidence?.quality_score ?? 0}/100)</li>
            <li>• Confidence score: {inspector.rag_confidence?.score ?? "-"}</li>
            <li>• Low confidence: {inspector.low_confidence_warning || inspector.rag_confidence?.low_confidence ? "yes" : "no"}</li>
          </ul>
          {inspector.rag_summary && <p className="mt-3 text-sm text-cyan-100">{inspector.rag_summary}</p>}
        </div>

        <div className="card-soft p-4">
          <div className="font-medium">Query Trace</div>
          <p className="mt-2 text-xs text-slate-400">Primary query</p>
          <p className="mt-1 text-sm text-slate-200">{activeTrace.primary_query || "-"}</p>
          <p className="mt-3 text-xs text-slate-400">Variants</p>
          <ul className="mt-1 space-y-1 text-xs text-slate-300">
            {(activeTrace.query_variants || []).slice(0, 3).map((variant, index) => (
              <li key={index} className="rounded-lg bg-white/5 p-2">{variant}</li>
            ))}
          </ul>
        </div>

        <div className="card-soft p-4">
          <div className="font-medium">Metadata Filters</div>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {(activeTrace.candidate_filters || []).slice(0, 6).map((filter, index) => (
              <li key={index}>• {Object.entries(filter).map(([k, v]) => `${k}=${v}`).join(", ")}</li>
            ))}
          </ul>
          <div className="mt-3 font-medium text-sm">Routed Collections</div>
          <ul className="mt-1 space-y-1 text-xs text-slate-400">
            {(activeTrace.routes || []).map((route, index) => (
              <li key={index}>• {route.layer} → {route.collection}</li>
            ))}
          </ul>
        </div>

        <div className="card-soft p-4">
          <div className="font-medium">Top-k Scores</div>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {(activeTrace.top_k_scores || activeEvidence).slice(0, 6).map((item, index) => {
              const row = item as RagEvidenceItem & Record<string, unknown>;
              return (
                <li key={index}>
                  • {String(row.source || "source")} · hybrid {String(row.hybrid_score ?? 0)}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="card-soft p-4">
        <div className="font-medium">Evidence ({phase === "question_generation" ? "Question RAG" : "Answer RAG"})</div>
        <ul className="mt-3 space-y-3">
          {activeEvidence.slice(0, 6).map((item, index) => {
            const citationId = `C${index + 1}`;
            const highlighted = highlightedCitationId === citationId;
            return (
              <li
                key={`${item.source}-${index}`}
                id={`rag-evidence-${citationId}`}
                className={`rounded-xl border p-3 ${highlighted ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/10 bg-white/5"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-sm">
                    {citationId} · {item.layer || "kb"} · {item.doc_type || "knowledge"} · {item.hybrid_score ?? 0}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-cyan-200 underline"
                    onClick={() => onCitationHighlight?.(highlighted ? null : citationId)}
                  >
                    {highlighted ? "Unhighlight" : "Highlight"}
                  </button>
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <ScoreBar label="Semantic" value={item.semantic_score} />
                  <ScoreBar label="Keyword" value={item.keyword_score} />
                  <ScoreBar label="Metadata" value={item.metadata_score} />
                  <ScoreBar label="Layer weight" value={item.layer_weight} />
                </div>
                <p className="mt-2 text-xs text-emerald-200/90">Why selected: {item.selection_reason || "Hybrid retrieval rank"}</p>
                {item.preview && <p className="mt-2 text-sm text-slate-300">{item.preview}</p>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-soft p-4">
          <div className="font-medium">Graph Paths</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {(inspector.graph_paths || []).slice(0, 4).map((path, index) => (
              <li key={index} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="font-medium text-cyan-100">{path.path_label}</div>
                {(path.kb_chunks || []).slice(0, 2).map((chunk, chunkIndex) => (
                  <p key={chunkIndex} className="mt-1 text-xs text-slate-400">
                    KB: {chunk.source} · {chunk.preview}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </div>
        <div className="card-soft p-4">
          <div className="font-medium">Personal Graph + Memory</div>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {(inspector.user_graph_edges || []).slice(0, 4).map((edge, index) => (
              <li key={index}>• {edge.source} {edge.relation} {edge.target}</li>
            ))}
          </ul>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            {(inspector.user_memory || []).slice(0, 4).map((memory, index) => (
              <li key={index}>• {memory.memory_type}: {memory.content}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
