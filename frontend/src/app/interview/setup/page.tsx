"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Brain,
  Mic,
  Video,
  Briefcase,
  Gauge,
  Target,
  Timer,
  UserRound,
  CalendarDays,
  Zap,
} from "lucide-react";
import { API_BASE, apiFetch } from "@/lib/api";

const difficulties = ["Junior", "Mid", "Senior"];

const modes = [
  {
    value: "text",
    label: "Text",
    description: "Written answers with structured feedback.",
    icon: Brain,
  },
  {
    value: "audio",
    label: "Audio",
    description: "Speak your answers and receive voice-based coaching.",
    icon: Mic,
  },
  {
    value: "video",
    label: "Video",
    description: "Use webcam or upload video for transcript-based interview evaluation.",
    icon: Video,
  },
  {
    value: "presence",
    label: "Presence",
    description:
      "3D interviewer room: lip-synced questions, voice answers auto-submit when you pause.",
    icon: UserRound,
  },
  {
    value: "case",
    label: "Case",
    description: "Product sense, system design, or market sizing case practice.",
    icon: Target,
  },
];

const lengths = ["5 Questions", "10 Questions", "15 Questions", "20 Minutes", "30 Minutes"];

const focusAreas = [
  "Behavioral",
  "Technical",
  "System Design",
  "Problem Solving",
  "Product Sense",
  "Market Sizing",
  "Communication",
  "Mixed",
];

type CompanyPack = {
  id: string;
  label: string;
  rubric_focus: string[];
  question_styles: string[];
};

function InterviewSetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [professions, setProfessions] = useState<string[]>([]);
  const [professionSearch, setProfessionSearch] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [profession, setProfession] = useState("");
  const [sector, setSector] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [companyPacks, setCompanyPacks] = useState<CompanyPack[]>([]);
  const [companyPack, setCompanyPack] = useState("general");
  const [instantMode, setInstantMode] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [caseType, setCaseType] = useState("product_sense");
  const [difficulty, setDifficulty] = useState("Junior");
  const [mode, setMode] = useState(searchParams.get("mode") || "text");
  const [length, setLength] = useState("10 Questions");
  const [focusArea, setFocusArea] = useState("Mixed");
  const [loading, setLoading] = useState(false);
  const [loadingProfessions, setLoadingProfessions] = useState(true);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [cvRationale, setCvRationale] = useState("");
  const [cvLimitations, setCvLimitations] = useState("");
  const [suggestedProfessions, setSuggestedProfessions] = useState<string[]>([]);
  const [suggestedSectors, setSuggestedSectors] = useState<string[]>([]);
  const [cvRoleBreakdown, setCvRoleBreakdown] = useState<{
    primary_role?: string;
    secondary_roles?: string[];
    role_feedback?: Array<{ role?: string; stance?: string; score?: number; evidence?: string[]; comment?: string }>;
  } | null>(null);
  const [cvRag, setCvRag] = useState<{
    summary?: string;
    quality?: { label?: string; score?: number };
    evidence?: Array<{ source?: string; preview?: string; relevance_label?: string }>;
  } | null>(null);
  const [cvEvaluator, setCvEvaluator] = useState<{
    headline?: string;
    fit?: string;
    strengths?: string[];
    weaknesses?: string[];
    for_role_note?: string;
    disclaimer?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/professions`);
        if (!res.ok) throw new Error("Could not load professions");

        const data = await res.json();
        const list = [...(data.professions || [])].sort((a: string, b: string) => a.localeCompare(b));
        setProfessions(list);
        setProfession(list[0] || "");
        const secRes = await fetch(`${API_BASE}/sectors`);
        if (secRes.ok) {
          const secData = await secRes.json();
          const secList = secData.sectors || [];
          setSectors(secList);
          setSector(secList[0] || "");
        }
        const packRes = await fetch(`${API_BASE}/interview/company-packs`);
        if (packRes.ok) {
          const packData = await packRes.json();
          setCompanyPacks(packData.packs || []);
        }
        try {
          const prefRes = await apiFetch("/account/preferences");
          const prefs = await prefRes.json();
          if (!searchParams.get("mode") && prefs.default_mode) setMode(prefs.default_mode);
          if (prefs.target_company) setTargetCompany(prefs.target_company);
          if (prefs.interview_date) setInterviewDate(prefs.interview_date);
          if (prefs.focus_area) setFocusArea(prefs.focus_area);
          if (prefs.difficulty) setDifficulty(prefs.difficulty);
        } catch {
          // Setup can still run without saved defaults.
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not load professions");
      } finally {
        setLoadingProfessions(false);
      }
    })();
  }, [searchParams]);

  const chosenMode = useMemo(
    () => modes.find((m) => m.value === mode) || modes[0],
    [mode]
  );
  const filteredProfessions = useMemo(() => {
    const needle = professionSearch.trim().toLowerCase();
    if (!needle) return professions;
    return professions.filter((item) => item.toLowerCase().includes(needle));
  }, [professionSearch, professions]);

  const handleStart = async () => {
    if (!profession) return;

    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch("/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession,
          difficulty,
          mode,
          interview_length: length,
          focus_area: focusArea,
          sector,
          target_company: targetCompany,
          company_pack: companyPack,
          instant_mode: instantMode,
          interview_date: interviewDate || null,
          case_type: mode === "case" ? caseType : null,
        }),
      });

      const data = await res.json();

      const targetPath =
        mode === "video"
          ? "/interview/video"
          : mode === "presence"
            ? "/interview/presence"
            : "/interview/live";

      const query = new URLSearchParams({
        session_id: String(data.session_id),
        profession,
        difficulty,
        mode,
        length,
        focusArea,
        sector,
        company: targetCompany,
        companyPack,
        instantMode: String(instantMode),
        interviewDate,
        caseType: mode === "case" ? caseType : "",
        question: data.first_question,
      });
      const qc =
        typeof data.question_context === "string" ? data.question_context.trim() : "";
      if (qc) {
        query.set("questionContext", qc);
      }
      const qr =
        typeof data.question_rationale === "string" ? data.question_rationale.trim() : "";
      if (qr) {
        query.set("questionRationale", qr);
      }

      router.push(`${targetPath}?${query.toString()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not start interview");
    } finally {
      setLoading(false);
    }
  };

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSuggestionLoading(true);
      const formData = new FormData();
      formData.append("cv_file", file);
      const res = await apiFetch("/cv/suggest", { method: "POST", body: formData });
      const data = await res.json();
      const profs: string[] = data.suggested_professions || [];
      const secs: string[] = data.suggested_sectors || [];
      setSuggestedProfessions(profs);
      setSuggestedSectors(secs);
      setCvRationale(data.rationale || "");
      setCvLimitations(data.limitations || "");
      setCvRoleBreakdown(
        data.role_fit_breakdown && typeof data.role_fit_breakdown === "object"
          ? (data.role_fit_breakdown as {
              primary_role?: string;
              secondary_roles?: string[];
              role_feedback?: Array<{ role?: string; stance?: string; score?: number; evidence?: string[]; comment?: string }>;
            })
          : null
      );
      setCvRag({
        summary: data.rag_summary || "",
        quality: data.retrieval_quality,
        evidence: Array.isArray(data.retrieval_evidence) ? data.retrieval_evidence : [],
      });
      setCvEvaluator(
        data.evaluator && typeof data.evaluator === "object"
          ? (data.evaluator as {
              headline?: string;
              fit?: string;
              strengths?: string[];
              weaknesses?: string[];
              for_role_note?: string;
              disclaimer?: string;
            })
          : null
      );
      if (profs[0]) setProfession(profs[0]);
      if (secs[0]) setSector(secs[0]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not analyze CV");
    } finally {
      setSuggestionLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <section className="container py-10">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="step-label">01 — Interview Setup</p>
          <h1 className="section-title mt-3">Create a Smart Interview Session</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Select profession, difficulty, mode, and focus to launch a realistic interview simulation.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="page-grid">
          <div className="glass panel">
            <div className="grid gap-6">
              <div>
                <label className="label">
                  <span className="inline-flex items-center gap-2">
                    <Briefcase size={16} />
                    Profession
                  </span>
                </label>
                <div className="mb-3 flex gap-2">
                  <input
                    value={professionSearch}
                    onChange={(e) => setProfessionSearch(e.target.value)}
                    className="input"
                    placeholder="Search profession, e.g. Data Engineer"
                    disabled={loadingProfessions}
                  />
                  {professionSearch && (
                    <button
                      type="button"
                      onClick={() => setProfessionSearch("")}
                      className="btn-secondary shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="select"
                  disabled={loadingProfessions}
                >
                  {filteredProfessions.length === 0 && (
                    <option value={profession} className="text-black">
                      No matches. Current: {profession || "None"}
                    </option>
                  )}
                  {filteredProfessions.map((item) => (
                    <option key={item} value={item} className="text-black">
                      {item}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  {filteredProfessions.length} of {professions.length} roles shown alphabetically.
                </p>
              </div>

              <div className="card-soft p-4">
                <div className="mb-2 font-medium">CV import & screening</div>
                <p className="mb-3 text-sm text-[var(--muted)]">
                  Upload your CV for role/sector suggestions and a short AI screening vs your profile role.
                </p>
                <input type="file" accept=".txt,.md,.pdf,.doc,.docx" onChange={handleCVUpload} />
                {suggestionLoading && <p className="mt-2 text-sm text-[var(--muted)]">Analyzing CV...</p>}
                {cvEvaluator && (
                  <div className="mt-4 space-y-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-left shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                        CV evaluator
                      </span>
                      {cvEvaluator.fit && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            cvEvaluator.fit === "strong"
                              ? "border border-[var(--card-border)] bg-[var(--card-soft)] text-[var(--foreground)]"
                              : cvEvaluator.fit === "moderate"
                                ? "border border-[var(--card-border)] bg-[var(--card-soft)] text-[var(--foreground)]"
                                : cvEvaluator.fit === "weak"
                                  ? "border border-[var(--card-border)] bg-[var(--card-soft)] text-[var(--foreground)]"
                                  : "border border-[var(--card-border)] bg-[var(--card-soft)] text-[var(--foreground)]"
                          }`}
                        >
                          Fit: {cvEvaluator.fit}
                        </span>
                      )}
                    </div>
                    {cvEvaluator.headline && (
                      <p className="text-sm font-medium text-[var(--foreground)]">{cvEvaluator.headline}</p>
                    )}
                    {cvEvaluator.for_role_note && (
                      <p className="text-sm leading-relaxed text-[var(--muted)]">{cvEvaluator.for_role_note}</p>
                    )}
                    {!!cvEvaluator.strengths?.length && (
                      <div>
                        <div className="text-xs font-semibold uppercase text-[var(--accent)]">Strengths</div>
                        <ul className="mt-1 list-inside list-disc text-sm text-[var(--muted)]">
                          {cvEvaluator.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!!cvEvaluator.weaknesses?.length && (
                      <div>
                        <div className="text-xs font-semibold uppercase text-[var(--accent)]">Gaps / risks</div>
                        <ul className="mt-1 list-inside list-disc text-sm text-[var(--muted)]">
                          {cvEvaluator.weaknesses.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cvEvaluator.disclaimer && (
                      <p className="text-xs text-[var(--muted)]">{cvEvaluator.disclaimer}</p>
                    )}
                  </div>
                )}
                {!!cvRationale && <p className="mt-3 text-sm text-[var(--muted)]">{cvRationale}</p>}
                {!!cvLimitations && (
                  <p className="mt-2 text-xs text-[var(--muted)]">{cvLimitations}</p>
                )}
                {cvRag?.summary && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] text-xs text-[var(--foreground)] shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] bg-[var(--card-soft)] px-3 py-2">
                      <span className="font-semibold uppercase tracking-wide text-[var(--accent)]">
                        RAG CV evidence
                      </span>
                      {(cvRag.quality?.label || typeof cvRag.quality?.score === "number") && (
                        <span className="rounded-full border border-[var(--card-border)] bg-[var(--card)] px-2 py-0.5 font-medium text-[var(--foreground)]">
                          {cvRag.quality?.label || "quality"}
                          {typeof cvRag.quality?.score === "number" ? ` · ${cvRag.quality.score}/100` : ""}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                    <p className="leading-relaxed text-[var(--muted)]">{cvRag.summary}</p>
                    {!!cvRag.evidence?.length && (
                      <ul className="mt-3 space-y-2 text-[var(--muted)]">
                        {cvRag.evidence.slice(0, 2).map((item, index) => (
                          <li
                            key={`${item.source || "kb"}-${index}`}
                            className="rounded-xl border border-[var(--card-border)] bg-[var(--card-soft)] px-3 py-2"
                          >
                            <span className="font-medium text-[var(--foreground)]">
                              {item.source || "knowledge base"}
                            </span>
                            <span className="text-[var(--muted)]">: </span>
                            <span>{item.preview}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    </div>
                  </div>
                )}
                {cvRoleBreakdown?.role_feedback?.length ? (
                  <div className="cv-role-fit-panel">
                    <div className="cv-role-fit-title">Role fit breakdown</div>
                    <p className="cv-role-fit-meta">
                      Primary: {cvRoleBreakdown.primary_role || "n/a"}
                      {!!cvRoleBreakdown.secondary_roles?.length && ` · Also relevant: ${cvRoleBreakdown.secondary_roles.join(", ")}`}
                    </p>
                    <div className="mt-3 space-y-2">
                      {cvRoleBreakdown.role_feedback.slice(0, 4).map((item, index) => (
                        <div key={`${item.role || "role"}-${index}`} className="cv-role-fit-card">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="cv-role-fit-name">{item.role}</span>
                            <span className="cv-role-fit-pill">
                              {item.stance?.replaceAll("_", " ")} · {item.score ?? 0}
                            </span>
                          </div>
                          <p className="cv-role-fit-copy">{item.comment}</p>
                          {!!item.evidence?.length && (
                            <p className="cv-role-fit-evidence">
                              Evidence: {item.evidence.slice(0, 5).join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {suggestedProfessions.length > 0 && (
                  <p className="cv-suggestion-line mt-2">
                    Suggested roles: {suggestedProfessions.join(", ")}
                  </p>
                )}
                {suggestedSectors.length > 0 && (
                  <p className="cv-suggestion-line mt-1">
                    Suggested sectors: {suggestedSectors.join(", ")}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="inline-flex items-center gap-2">
                    <Gauge size={16} />
                    Difficulty
                  </span>
                </label>
                  <div className="grid gap-3 md:grid-cols-3">
                  {difficulties.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDifficulty(item)}
                      className={`rounded-3xl border px-4 py-4 text-left transition ${
                        difficulty === item
                          ? "border-black bg-[#f7f3ed] shadow-sm"
                          : "border-black/10 bg-white hover:bg-[#f7f3ed]"
                      }`}
                    >
                      <div className="font-semibold">{item}</div>
                      <div className="mt-1 text-sm text-slate-300">
                        {item === "Junior" && "Foundational and entry-level questions."}
                        {item === "Mid" && "Balanced real-world practical questions."}
                        {item === "Senior" && "Advanced depth and leadership focus."}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="inline-flex items-center gap-2">
                    <Brain size={16} />
                    Interview Mode
                  </span>
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  {modes.map((item) => {
                    const Icon = item.icon;
                    const active = mode === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setMode(item.value)}
                        className={`rounded-3xl border p-4 text-left transition ${
                          active
                            ? "border-black bg-[#f7f3ed] shadow-sm"
                            : "border-black/10 bg-white hover:bg-[#f7f3ed]"
                        }`}
                      >
                        <div className="mb-3 inline-flex rounded-2xl bg-white p-3 shadow-sm">
                          <Icon size={18} />
                        </div>
                        <div className="font-semibold">{item.label}</div>
                        <div className="mt-2 text-sm text-slate-300">
                          {item.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="label">
                    <span className="inline-flex items-center gap-2">
                      <Timer size={16} />
                      Interview Length
                    </span>
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="select"
                  >
                    {lengths.map((item) => (
                      <option key={item} value={item} className="text-black">
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="inline-flex items-center gap-2">
                      <Target size={16} />
                      Focus Area
                    </span>
                  </label>
                  <select
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    className="select"
                  >
                    {focusAreas.map((item) => (
                      <option key={item} value={item} className="text-black">
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">
                    <span className="inline-flex items-center gap-2">
                      <Target size={16} />
                      Sector Pack
                    </span>
                  </label>
                  <select value={sector} onChange={(e) => setSector(e.target.value)} className="select">
                    {sectors.map((item) => (
                      <option key={item} value={item} className="text-black">
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Target Company (Optional)</label>
                <input
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="input"
                    placeholder="e.g. Nike, Disney, Spotify, Airbnb"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="label">Company Loop</label>
                  <select
                    value={companyPack}
                    onChange={(e) => setCompanyPack(e.target.value)}
                    className="select"
                  >
                    <option value="general" className="text-black">
                      General Interview
                    </option>
                    {companyPacks.map((pack) => (
                      <option key={pack.id} value={pack.id} className="text-black">
                        {pack.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-300">
                    Uses company-style questions and rubric focus where available.
                  </p>
                </div>

                <div>
                  <label className="label">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={16} />
                      Interview Date
                    </span>
                  </label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="input"
                  />
                  <p className="mt-2 text-xs text-slate-300">
                    Used to build your prep roadmap and calendar.
                  </p>
                </div>
              </div>

              {mode === "case" && (
                <div className="card-soft p-4">
                  <div className="mb-3 font-medium">Case Type</div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      ["product_sense", "Product Sense"],
                      ["system_design", "System Design"],
                      ["market_sizing", "Market Sizing"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCaseType(value)}
                        className={`rounded-2xl border px-4 py-3 text-left ${
                          caseType === value
                            ? "border-black bg-white"
                            : "border-black/10 bg-transparent"
                        }`}
                      >
                        <div className="font-semibold">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setInstantMode((v) => !v)}
                className={`card-soft flex items-center justify-between p-4 text-left ${
                  instantMode ? "border-black bg-white" : ""
                }`}
              >
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <Zap size={16} />
                    Instant Mode
                  </span>
                  <span className="mt-1 block text-sm text-slate-300">
                    Faster practice: feedback appears without auto voice replay after every answer.
                  </span>
                </span>
                <span className="rounded-full border border-black/10 px-3 py-1 text-sm">
                  {instantMode ? "On" : "Off"}
                </span>
              </button>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStart}
                  className="btn-primary"
                  disabled={!profession || loading}
                >
                  {loading ? "Starting..." : "Start Interview"}
                </button>

                <a href="/dashboard" className="btn-secondary">
                  Back to Dashboard
                </a>
              </div>
            </div>
          </div>

          <aside className="glass panel">
            <h2 className="text-xl font-semibold">Session Summary</h2>
            <p className="mt-2 text-sm text-slate-300">
              The selected configuration shapes the interview flow and coaching.
            </p>

            <div className="mt-6 space-y-4">
              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Profession</div>
                <div className="mt-1 font-semibold">{profession || "-"}</div>
              </div>

              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Difficulty</div>
                <div className="mt-1 font-semibold">{difficulty}</div>
              </div>

              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Mode</div>
                <div className="mt-1 font-semibold">{chosenMode.label}</div>
              </div>

              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Length</div>
                <div className="mt-1 font-semibold">{length}</div>
              </div>

              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Focus</div>
                <div className="mt-1 font-semibold">{focusArea}</div>
              </div>
              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Sector</div>
                <div className="mt-1 font-semibold">{sector || "-"}</div>
              </div>
              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Target Company</div>
                <div className="mt-1 font-semibold">{targetCompany || "-"}</div>
              </div>
              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Company Loop</div>
                <div className="mt-1 font-semibold">
                  {companyPacks.find((pack) => pack.id === companyPack)?.label || "General Interview"}
                </div>
              </div>
              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Interview Date</div>
                <div className="mt-1 font-semibold">{interviewDate || "Auto roadmap"}</div>
              </div>
              <div className="card-soft p-4">
                <div className="text-sm text-slate-300">Instant Mode</div>
                <div className="mt-1 font-semibold">{instantMode ? "Enabled" : "Off"}</div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function InterviewSetupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <InterviewSetupPageContent />
    </Suspense>
  );
}