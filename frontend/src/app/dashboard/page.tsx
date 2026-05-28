"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearToken } from "@/lib/api";
import {
  Brain,
  Video,
  Mic,
  BarChart3,
  LogOut,
  ArrowRight,
  Clock3,
  UserRound,
  Zap,
  BookOpen,
  CalendarDays,
  Target,
} from "lucide-react";

type SessionItem = {
  session_id: number;
  profession: string;
  created_at: string;
  average_score: number | null;
  completed: boolean;
  done: boolean;
  turn_count: number;
  current_question?: string | null;
  config?: {
    difficulty?: string;
    mode?: string;
    interview_length?: string;
    focus_area?: string;
    sector?: string;
    target_company?: string;
    company_pack?: string;
    instant_mode?: boolean;
    interview_date?: string;
    case_type?: string;
  } | null;
};

type ProgressAnalytics = {
  summary: {
    average_score?: number | null;
    best_score?: number | null;
    trend?: number | null;
    scored_sessions: number;
  };
  focus_breakdown: Array<{ focus: string; average_score: number; turns: number }>;
  next_best_action: string;
};

type QuestionQuality = {
  summary: {
    questions_scanned: number;
    unique_questions: number;
    duplicate_count: number;
    freshness_score: number;
  };
  recommendation: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [questionQuality, setQuestionQuality] = useState<QuestionQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await apiFetch("/auth/me");
      } catch {
        router.push("/login");
        setLoading(false);
        return;
      }
      try {
        const [res, progressRes, qualityRes] = await Promise.all([
          apiFetch("/interview/sessions"),
          apiFetch("/analytics/progress"),
          apiFetch("/quality/questions"),
        ]);
        const [data, progress, quality] = await Promise.all([res.json(), progressRes.json(), qualityRes.json()]);
        setSessions(data.sessions || []);
        setAnalytics(progress);
        setQuestionQuality(quality);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not load sessions");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const stats = useMemo(() => {
    const completed = sessions.filter((s) => s.completed);
    const avg =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, s) => sum + (s.average_score || 0), 0) /
              completed.length
          )
        : 0;

    return {
      total: sessions.length,
      completed: completed.length,
      average: avg,
      lastPractice: sessions[0]?.created_at
        ? new Date(sessions[0].created_at).toLocaleDateString()
        : "-",
      active: sessions.filter((s) => !s.completed).length,
      bestScore: completed.reduce((max, s) => Math.max(max, s.average_score || 0), 0),
    };
  }, [sessions]);

  const handleLogout = async () => {
    await clearToken();
    router.push("/login");
  };

  const handleInstantStart = async () => {
    try {
      setError(null);
      const res = await apiFetch("/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: "Junior",
          mode: "text",
          interview_length: "5 Questions",
          focus_area: "Mixed",
          company_pack: "general",
          instant_mode: true,
        }),
      });
      const data = await res.json();
      const query = new URLSearchParams({
        session_id: String(data.session_id),
        profession: data.config?.profession || sessions[0]?.profession || "Frontend Developer",
        difficulty: "Junior",
        mode: "text",
        length: "5 Questions",
        focusArea: "Mixed",
        sector: "",
        company: "",
        companyPack: "general",
        instantMode: "true",
        question: data.first_question,
      });
      if (data.question_context) query.set("questionContext", data.question_context);
      if (data.question_rationale) query.set("questionRationale", data.question_rationale);
      router.push(`/interview/live?${query.toString()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not start instant session");
    }
  };

  const seedDemoData = async () => {
    try {
      setError(null);
      await apiFetch("/demo/seed", { method: "POST" });
      const [sessionsRes, progressRes] = await Promise.all([
        apiFetch("/interview/sessions"),
        apiFetch("/analytics/progress"),
      ]);
      const [sessionData, progressData] = await Promise.all([sessionsRes.json(), progressRes.json()]);
      setSessions(sessionData.sessions || []);
      setAnalytics(progressData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create demo data");
    }
  };

  const buildResumeHref = (session: SessionItem) => {
    const mode = session.config?.mode || "text";
    const targetPath =
      mode === "video"
        ? "/interview/video"
        : mode === "presence"
          ? "/interview/presence"
          : "/interview/live";
    const query = new URLSearchParams({
      session_id: String(session.session_id),
      profession: session.profession,
      difficulty: session.config?.difficulty || "Junior",
      mode,
      length: session.config?.interview_length || "10 Questions",
      focusArea: session.config?.focus_area || "Mixed",
      sector: session.config?.sector || "",
      company: session.config?.target_company || "",
      companyPack: session.config?.company_pack || "general",
      instantMode: String(Boolean(session.config?.instant_mode)),
      interviewDate: session.config?.interview_date || "",
      caseType: session.config?.case_type || "",
      question:
        session.current_question ||
        "Tell me about yourself and why you're interested in this role.",
    });

    return `${targetPath}?${query.toString()}`;
  };

  return (
    <main className="min-h-screen">
      <section className="container py-10">
        <div className="mb-8 flex flex-col gap-6 rounded-[32px] border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="step-label">Dashboard</p>
            <h1 className="section-title mt-3">Your Interview Coaching Hub</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Your live session data, outcomes, and resume workflow are all managed here.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleInstantStart} className="btn-primary" type="button">
              <Zap size={16} />
              Instant Practice
            </button>
            <a href="/interview/setup" className="btn-primary">
              Start New Session
            </a>
            <a href="/roadmap" className="btn-secondary">
              <CalendarDays size={16} />
              Roadmap
            </a>
            <a href="/stories" className="btn-secondary">
              <BookOpen size={16} />
              Story Vault
            </a>
            <a href="/recruiter" className="btn-secondary">
              Recruiter Mode
            </a>
            <button onClick={handleLogout} className="btn-secondary" type="button">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass panel">
            <div className="text-sm text-slate-300">Total Sessions</div>
            <div className="stat-value mt-3">{stats.total}</div>
            <p className="mt-2 text-sm text-slate-300">{stats.active} active sessions</p>
          </div>

          <div className="glass panel">
            <div className="text-sm text-slate-300">Completed Sessions</div>
            <div className="stat-value mt-3">{stats.completed}</div>
          </div>

          <div className="glass panel">
            <div className="text-sm text-slate-300">Average Score</div>
            <div className="stat-value mt-3">{stats.average}</div>
            <p className="mt-2 text-sm text-slate-300">Best: {stats.bestScore || "-"}</p>
          </div>

          <div className="glass panel">
            <div className="text-sm text-slate-300">Last Practice</div>
            <div className="stat-value mt-3 text-2xl">{stats.lastPractice}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="glass panel">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Today&apos;s Practice Hub</h2>
              <p className="mt-1 text-sm text-slate-300">
                Pick the shortest path to progress: quick session, case drill, roadmap, or saved stories.
              </p>
            </div>

            <div className="rounded-[30px] border border-cyan-400/30 bg-cyan-500/10 p-5 md:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-white/70 px-3 py-1 text-xs font-semibold text-cyan-300">
                    <Zap size={14} />
                    Recommended today
                  </div>
                  <h3 className="mt-4 text-2xl font-bold tracking-[-0.03em]">Start with Instant Practice</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Get a quick 5-question baseline, then use the roadmap and story vault to sharpen the weak spots.
                  </p>
                </div>
                <button type="button" onClick={handleInstantStart} className="btn-primary md:min-w-48">
                  <Zap size={16} />
                  Start Quick Practice
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Choose a format</h3>
                <span className="text-xs text-slate-300">All modes keep your existing interview flow</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <a href="/interview/setup?mode=text" className="card-soft min-h-44 p-5">
                  <div className="flex h-full flex-col">
                    <Brain size={22} />
                    <h3 className="mt-4 font-semibold">Write an Answer</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Structured written answers with AI evaluation.
                    </p>
                    <span className="mt-auto pt-5 text-sm font-medium text-cyan-300">Text Interview</span>
                  </div>
                </a>

                <a href="/interview/setup?mode=audio" className="card-soft min-h-44 p-5">
                  <div className="flex h-full flex-col">
                    <Mic size={22} />
                    <h3 className="mt-4 font-semibold">Speak Out Loud</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Record spoken answers and receive voice feedback.
                    </p>
                    <span className="mt-auto pt-5 text-sm font-medium text-cyan-300">Audio Interview</span>
                  </div>
                </a>

                <a href="/interview/setup?mode=video" className="card-soft min-h-44 p-5">
                  <div className="flex h-full flex-col">
                    <Video size={22} />
                    <h3 className="mt-4 font-semibold">Camera Practice</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Transcript-based video interview evaluation.
                    </p>
                    <span className="mt-auto pt-5 text-sm font-medium text-cyan-300">Video Interview</span>
                  </div>
                </a>

                <a href="/interview/setup?mode=presence" className="card-soft min-h-44 p-5">
                  <div className="flex h-full flex-col">
                    <UserRound size={22} />
                    <h3 className="mt-4 font-semibold">Mock Interview Room</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      3D interviewer with lip-sync; speak naturally and answers auto-submit on pause.
                    </p>
                    <span className="mt-auto pt-5 text-sm font-medium text-cyan-300">Presence Interview</span>
                  </div>
                </a>

                <a href="/interview/setup?mode=case" className="card-soft min-h-44 p-5 sm:col-span-2 xl:col-span-2">
                  <div className="flex h-full flex-col md:flex-row md:items-center md:justify-between md:gap-6">
                    <div>
                      <Target size={22} />
                      <h3 className="mt-4 font-semibold">Case Drill</h3>
                      <p className="mt-2 max-w-xl text-sm text-slate-300">
                        Product sense, system design, and market sizing cases with focused rubrics.
                      </p>
                    </div>
                    <span className="mt-auto pt-5 text-sm font-medium text-cyan-300 md:mt-0 md:pt-0">Case Mode</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="glass panel">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Product Readiness</h2>
              <p className="mt-1 text-sm text-slate-300">
                Core interview workflows and growth tools are available from this account.
              </p>
            </div>

            <div className="space-y-4">
              <div className="card-soft p-4">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 size={18} />
                  <span className="font-medium">Scoring</span>
                </div>
                <p className="text-sm text-slate-300">
                  14-dimension scorecard, tone detection, confidence, and next steps.
                </p>
              </div>

              <div className="card-soft p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Video size={18} />
                  <span className="font-medium">Preparation System</span>
                </div>
                <p className="text-sm text-slate-300">
                  Roadmap, weekly drills, story vault, company loops, and case mode.
                </p>
              </div>

              <div className="card-soft p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Clock3 size={18} />
                  <span className="font-medium">Data Control</span>
                </div>
                <p className="text-sm text-slate-300">
                  Review usage and privacy controls in Settings whenever needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass panel mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Recent Sessions</h2>
            <p className="mt-1 text-sm text-slate-300">
              Real session data from your account.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-3">
              <div className="skeleton h-16" />
              <div className="skeleton h-16" />
              <div className="skeleton h-16" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <h3 className="font-semibold">Your first session is one click away</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
                Start with Instant Practice for a quick baseline, then use Roadmap and Story Vault to improve intentionally.
              </p>
              <button type="button" onClick={handleInstantStart} className="btn-primary mt-5">
                Start Instant Practice
              </button>
              <button type="button" onClick={seedDemoData} className="btn-secondary mt-3">
                Add Demo Data
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-sm text-slate-300">
                    <th className="pb-2">Profession</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Turns</th>
                    <th className="pb-2">Average Score</th>
                    <th className="pb-2">Created</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.session_id}>
                      <td className="rounded-l-2xl border border-white/10 border-r-0 bg-white/5 px-4 py-4">
                        {session.profession}
                      </td>
                      <td className="border border-white/10 border-l-0 border-r-0 bg-white/5 px-4 py-4">
                        {session.completed ? "Completed" : "In Progress"}
                      </td>
                      <td className="border border-white/10 border-l-0 border-r-0 bg-white/5 px-4 py-4">
                        {session.turn_count}
                      </td>
                      <td className="border border-white/10 border-l-0 border-r-0 bg-white/5 px-4 py-4">
                        {session.average_score ?? "-"}
                      </td>
                      <td className="border border-white/10 border-l-0 border-r-0 bg-white/5 px-4 py-4">
                        {new Date(session.created_at).toLocaleString()}
                      </td>
                      <td className="rounded-r-2xl border border-white/10 border-l-0 bg-white/5 px-4 py-4">
                        {session.completed ? (
                          <a
                            href={`/results/${session.session_id}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300"
                          >
                            View Results <ArrowRight size={16} />
                          </a>
                        ) : (
                          <a
                            href={buildResumeHref(session)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300"
                          >
                            Resume <ArrowRight size={16} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass panel mt-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="step-label">Progress Analytics</p>
              <h2 className="mt-2 text-xl font-semibold">What to improve next</h2>
              <p className="mt-1 text-sm text-slate-300">
                {analytics?.next_best_action || "Complete a session to unlock progress analytics."}
              </p>
            </div>
            <a href="/roadmap" className="btn-secondary">
              Build Roadmap
            </a>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="card-soft p-4">
              <div className="text-sm text-slate-300">Analytics Average</div>
              <div className="stat-value mt-2">{analytics?.summary.average_score ?? "-"}</div>
            </div>
            <div className="card-soft p-4">
              <div className="text-sm text-slate-300">Best Session</div>
              <div className="stat-value mt-2">{analytics?.summary.best_score ?? "-"}</div>
            </div>
            <div className="card-soft p-4">
              <div className="text-sm text-slate-300">Score Trend</div>
              <div className="stat-value mt-2">
                {typeof analytics?.summary.trend === "number"
                  ? `${analytics.summary.trend > 0 ? "+" : ""}${analytics.summary.trend}`
                  : "-"}
              </div>
            </div>
          </div>
          {!!analytics?.focus_breakdown.length && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {analytics.focus_breakdown.slice(0, 4).map((item) => (
                <div key={item.focus} className="card-soft p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.focus}</span>
                    <span className="text-sm text-slate-300">{item.turns} turns</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-500/30" style={{ width: `${item.average_score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 rounded-3xl border border-cyan-400/30 bg-cyan-500/10 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold">Question Freshness</div>
                <p className="mt-1 text-sm text-slate-300">
                  {questionQuality?.recommendation || "Start a session to measure question quality."}
                </p>
              </div>
              <div className="text-3xl font-bold">{questionQuality?.summary.freshness_score ?? "-"}%</div>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div className="card-soft p-3">Scanned: {questionQuality?.summary.questions_scanned ?? 0}</div>
              <div className="card-soft p-3">Unique: {questionQuality?.summary.unique_questions ?? 0}</div>
              <div className="card-soft p-3">Repeats: {questionQuality?.summary.duplicate_count ?? 0}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}