"use client";

import { useState } from "react";
import { apiFetch, setAccessToken, setCsrfToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("yigit@test.com");
  const [password, setPassword] = useState("12345678");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as { access_token?: string; csrf_token?: string };
      if (data.access_token) setAccessToken(data.access_token);
      if (data.csrf_token) setCsrfToken(data.csrf_token);
      router.push("/dashboard");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-[32px] p-7 space-y-4">
        <div className="text-center">
          <p className="step-label">01 — Welcome back</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em]">Login</h1>
          <p className="mt-2 text-sm text-slate-300">Continue your interview practice.</p>
        </div>
        {err && <div className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">{err}</div>}

        <input
          className="input-dark"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />

        <input
          className="input-dark"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <a href="/register" className="block text-center text-sm font-medium text-cyan-300">
          Don&apos;t have an account? Register
        </a>
      </form>
    </main>
  );
}