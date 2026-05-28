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
  weeks: number;
  drills: WeeklyDrill[];
  rag_summary?: string;
  retrieval_quality?: { label?: string; score?: number };
};

export default function RoadmapPage() {
  const [targetCompany, setTargetCompany] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [focusArea, setFocusArea] = useState("Mixed");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [weeklyDrills, setWeeklyDrills] = useState<WeeklyDrills | null>(null);
  const [completedDrills, setCompletedDrills] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const loadRoadmap = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        target_company: targetCompany,
        interview_date: interviewDate,
        focus_area: focusArea,
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
    }
  }, [focusArea, interviewDate, targetCompany]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(async () => {
      try {
        const res = await apiFetch("/account/preferences");
        const prefs = await res.json();
        if (prefs.target_company) setTargetCompany(prefs.target_company);
        if (prefs.interview_date) setInterviewDate(prefs.interview_date);
        if (prefs.focus_area) setFocusArea(prefs.focus_area);
      } catch {
        // Roadmap falls back to generic defaults.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadRoadmap();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loadRoadmap]);

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

  return (
    <main className="min-h-screen">
      <section className="container py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="step-label">Prep Roadmap</p>
          <h1 className="section-title mt-3">Interview Calendar</h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Build a day-by-day prep plan plus weekly drills around your role, target company, and interview date.
          </p>
        </div>

        <div className="glass mx-auto mt-8 max-w-4xl rounded-[32px] p-6">
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
            <button type="button" onClick={loadRoadmap} className="btn-primary">
              Build Roadmap
            </button>
          </div>
          {error && <div className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        </div>

        {roadmap && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
            <aside className="glass panel">
              <div className="text-sm text-slate-300">Target</div>
              <div className="mt-1 text-2xl font-bold">{roadmap.target_company}</div>
              <div className="mt-5 text-sm text-slate-300">Role</div>
              <div className="mt-1 font-semibold">{roadmap.profession}</div>
              <div className="mt-5 text-sm text-slate-300">Interview Date</div>
              <div className="mt-1 font-semibold">{roadmap.interview_date}</div>
              <div className="mt-5 text-sm text-slate-300">Plan Length</div>
              <div className="mt-1 font-semibold">{roadmap.days_left} days</div>
              {roadmap.rag_summary && (
                <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">
                  <div className="font-semibold">
                    RAG plan quality {roadmap.retrieval_quality?.label ? `· ${roadmap.retrieval_quality.label}` : ""}
                    {typeof roadmap.retrieval_quality?.score === "number" ? ` (${roadmap.retrieval_quality.score}/100)` : ""}
                  </div>
                  <p className="mt-1 text-cyan-100/80">{roadmap.rag_summary}</p>
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
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">
                      Focus: {day.focus}
                    </p>
                    {day.evidence_note && (
                      <p className="mt-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-2 text-xs text-cyan-100">
                        Evidence: {day.evidence_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                <p className="mt-2 text-sm font-semibold text-cyan-300">
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
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
                  <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                    <span className="font-medium">Done when:</span> {drill.success_criteria}
                  </div>
                  {drill.evidence_note && (
                    <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">
                      <span className="font-semibold">RAG evidence:</span> {drill.evidence_note}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleDrill(drill)}
                    className="btn-secondary mt-4"
                  >
                    {completedDrills[drillKey(drill)] ? "Completed" : "Mark Complete"}
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
