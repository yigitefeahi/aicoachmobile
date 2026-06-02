"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type RoadmapDay = {
  day: number;
  date: string;
  title: string;
  detail: string;
  focus: string;
  evidence_note?: string | null;
};

type Roadmap = {
  profession: string;
  target_company: string;
  interview_date: string;
  focus_area?: string;
  days_left: number;
  schedule: RoadmapDay[];
  rag_summary?: string;
  retrieval_quality?: { label?: string; score?: number };
};

type WeeklyDrill = {
  week: number;
  label: string;
  title: string;
  goal: string;
  duration_minutes: number;
  focus: string;
  actions: string[];
  success_criteria: string;
  evidence_note?: string | null;
};

type WeeklyDrills = {
  profession: string;
  target_company: string;
  interview_date: string;
  focus_area?: string;
  weeks: number;
  drills: WeeklyDrill[];
  rag_summary?: string;
  retrieval_quality?: { label?: string; score?: number };
};

function localTodayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RoadmapPage() {
  const [targetCompany, setTargetCompany] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [focusArea, setFocusArea] = useState("Mixed");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [weeklyDrills, setWeeklyDrills] = useState<WeeklyDrills | null>(null);
  const [completedDrills, setCompletedDrills] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRoadmap = useCallback(async (company: string, date: string, focus: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        target_company: company,
        interview_date: date,
        focus_area: focus,
      });
      const [roadmapRes, drillsRes, completionRes] = await Promise.all([
        apiFetch(`/interview/roadmap?${params.toString()}`),
        apiFetch(`/interview/weekly-drills?${params.toString()}`),
        apiFetch("/interview/drill-completions"),
      ]);
      const [roadmapData, drillData, completionData] = await Promise.all([
        roadmapRes.json(),
        drillsRes.json(),
        completionRes.json(),
      ]);
      setRoadmap(roadmapData);
      setWeeklyDrills(drillData);
      setCompletedDrills(completionData.completions || {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load roadmap");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBuildRoadmap = () => {
    const minDate = localTodayIso();
    if (!interviewDate.trim()) {
      setError("Select an interview date to build a timed plan.");
      return;
    }
    if (interviewDate < minDate) {
      setError("Interview date cannot be in the past.");
      return;
    }
    void fetchRoadmap(targetCompany, interviewDate, focusArea);
  };

  useEffect(() => {
    void (async () => {
      let company = "";
      let date = "";
      let focus = "Mixed";
      try {
        const res = await apiFetch("/account/preferences");
        const prefs = await res.json();
        company = prefs.target_company || "";
        date = prefs.interview_date || "";
        focus = prefs.focus_area || "Mixed";
        const minDate = localTodayIso();
        if (date && date < minDate) {
          date = "";
        }
        if (company) setTargetCompany(company);
        if (date) setInterviewDate(date);
        if (focus) setFocusArea(focus);
      } catch {
        // Roadmap falls back to generic defaults.
      } finally {
        setPrefsLoaded(true);
      }
      if (date.trim()) {
        await fetchRoadmap(company, date, focus);
      } else {
        setLoading(false);
        setRoadmap(null);
        setWeeklyDrills(null);
      }
    })();
  }, [fetchRoadmap]);

  const drillKey = (drill: WeeklyDrill) =>
    `${weeklyDrills?.target_company || "general"}:${weeklyDrills?.interview_date || "auto"}:${focusArea}:${drill.week}:${drill.title}`;

  const toggleDrill = async (drill: WeeklyDrill) => {
    const key = drillKey(drill);
    const completed = !completedDrills[key];
    const next = { ...completedDrills, [key]: completed };
    setCompletedDrills(next);
    try {
      await apiFetch("/interview/drill-completions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drill_key: key, completed }),
      });
    } catch (e: unknown) {
      setCompletedDrills(completedDrills);
      setError(e instanceof Error ? e.message : "Could not save drill progress");
    }
  };

  const completedCount = weeklyDrills
    ? weeklyDrills.drills.filter((drill) => completedDrills[drillKey(drill)]).length
    : 0;

  const isInitialLoading = loading && !roadmap;
  const isRefreshing = loading && Boolean(roadmap);
  const loadingLabel = !prefsLoaded ? "Loading your saved preferences…" : "Building your prep roadmap…";
  const loadingDetail = !prefsLoaded
    ? "Pulling target company, interview date, and focus defaults from your profile."
    : "Calibrating daily schedule, weekly drills, and RAG evidence for your selections.";

  const renderLoadingPanel = (className = "") => (
    <div className={`roadmap-loading-panel glass mx-auto max-w-4xl ${className}`.trim()} aria-live="polite" aria-busy="true">
      <div className="roadmap-loading-spinner" aria-hidden="true" />
      <div className="roadmap-loading-title">{loadingLabel}</div>
      <p className="roadmap-loading-copy">{loadingDetail}</p>
      <div className="roadmap-loading-meta">
        {targetCompany ? <span className="roadmap-loading-chip">{targetCompany}</span> : null}
        {interviewDate ? <span className="roadmap-loading-chip">{interviewDate}</span> : null}
        <span className="roadmap-loading-chip">{focusArea}</span>
      </div>
      <div className="roadmap-loading-skeletons">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );

  return (
    <main className="roadmap-page min-h-screen">
      <section className="container py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="step-label">Prep Roadmap</p>
          <h1 className="section-title mt-3">Interview Calendar</h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Build a day-by-day prep plan plus weekly drills around your role, target company, and interview date.
          </p>
        </div>

        <div className="roadmap-form-panel glass mx-auto mt-8 max-w-4xl rounded-[32px] p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <input
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              className="input"
              placeholder="Target company"
            />
            <input
              type="date"
              value={interviewDate}
              min={localTodayIso()}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="input"
            />
            <select value={focusArea} onChange={(e) => setFocusArea(e.target.value)} className="select">
              {["Mixed", "Behavioral", "Technical", "Product Sense", "System Design", "Market Sizing"].map((item) => (
                <option key={item} value={item} className="text-black">
                  {item}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleBuildRoadmap} className="btn-primary" disabled={loading}>
              {loading ? "Building..." : "Build Roadmap"}
            </button>
          </div>
          {error && <div className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        </div>

        {isInitialLoading && renderLoadingPanel("roadmap-initial-loading")}

        {roadmap && (
          <div className="roadmap-results mt-8">
            {isRefreshing && (
              <div className="roadmap-results-overlay" aria-live="polite" aria-busy="true">
                <div className="roadmap-loading-spinner" aria-hidden="true" />
                <div className="roadmap-loading-title">{loadingLabel}</div>
                <p className="roadmap-results-overlay-copy">{loadingDetail}</p>
              </div>
            )}

            <div className={isRefreshing ? "pointer-events-none opacity-70" : ""}>
              <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
            <aside className="glass panel">
              <div className="text-sm text-slate-300">Target</div>
              <div className="mt-1 text-2xl font-bold">{roadmap.target_company}</div>
              <div className="mt-5 text-sm text-slate-300">Role</div>
              <div className="mt-1 font-semibold">{roadmap.profession}</div>
              <div className="mt-5 text-sm text-slate-300">Interview Date</div>
              <div className="mt-1 font-semibold">{roadmap.interview_date}</div>
              <div className="mt-5 text-sm text-slate-300">Focus Area</div>
              <div className="mt-1 font-semibold">{roadmap.focus_area || focusArea}</div>
              <div className="mt-5 text-sm text-slate-300">Plan Length</div>
              <div className="mt-1 font-semibold">{roadmap.days_left} days</div>
              {roadmap.rag_summary && (
                <div className="roadmap-rag-box">
                  <div className="roadmap-rag-box-title">
                    RAG plan quality {roadmap.retrieval_quality?.label ? `· ${roadmap.retrieval_quality.label}` : ""}
                    {typeof roadmap.retrieval_quality?.score === "number" ? ` (${roadmap.retrieval_quality.score}/100)` : ""}
                  </div>
                  <p className="roadmap-rag-box-body">{roadmap.rag_summary}</p>
                </div>
              )}
              <a href="/dashboard" className="btn-secondary mt-6">
                Back to Dashboard
              </a>
            </aside>

            <div className="glass panel">
              <div className="space-y-3">
                {roadmap.schedule.map((day) => (
                  <div key={`${day.day}-${day.date}`} className="card-soft p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold">
                        Day {day.day}: {day.title}
                      </div>
                      <span className="rounded-full border border-black/10 px-3 py-1 text-xs">{day.date}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{day.detail}</p>
                    <p className="roadmap-focus-label">Focus: {day.focus}</p>
                    {day.evidence_note && (
                      <p className="roadmap-evidence-box">Evidence: {day.evidence_note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
              </div>

            {weeklyDrills && (
              <div className="glass panel mt-8">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="step-label">Weekly Drills</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
                      Short Practice Blocks That Keep You Moving
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">
                      {weeklyDrills.weeks} week plan for {weeklyDrills.target_company}. Each drill is designed to fit
                      around a normal workday.
                    </p>
                    <p className="roadmap-progress-label">
                      Progress: {completedCount}/{weeklyDrills.drills.length} drills completed
                    </p>
                  </div>
                  <a href="/interview/setup?mode=case" className="btn-secondary">
                    Start Case Drill
                  </a>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {weeklyDrills.drills.map((drill) => (
                    <article key={`${drill.week}-${drill.title}`} className="card-soft p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="roadmap-drill-label">
                            {drill.label} · {drill.focus}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold">{drill.title}</h3>
                        </div>
                        <span className="rounded-full border border-black/10 px-3 py-1 text-xs">
                          {drill.duration_minutes} min
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{drill.goal}</p>
                      <div className="mt-4">
                        <div className="text-sm font-medium">Actions</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-300">
                          {drill.actions.map((action, index) => (
                            <li key={index}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="roadmap-callout">
                        <span className="roadmap-callout-label">Done when:</span> {drill.success_criteria}
                      </div>
                      {drill.evidence_note && (
                        <div className="roadmap-evidence-box mt-3">
                          <span className="roadmap-callout-label">RAG evidence:</span> {drill.evidence_note}
                        </div>
                      )}
                      <button type="button" onClick={() => toggleDrill(drill)} className="btn-secondary mt-4">
                        {completedDrills[drillKey(drill)] ? "Completed" : "Mark Complete"}
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
