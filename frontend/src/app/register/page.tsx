"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_BASE, setAccessToken, setCsrfToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [professions, setProfessions] = useState<string[]>([]);
  const [name, setName] = useState("Yigit");
  const [email, setEmail] = useState("yigit@test.com");
  const [password, setPassword] = useState("12345678");
  const [profession, setProfession] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE}/professions`);
      if (!res.ok) throw new Error(`GET /professions failed: ${res.status}`);
      const data = await res.json();
      const list = data.professions || [];
      setProfessions(list);
      setProfession(list[0] || "");
    })().catch((e: unknown) => {
      setErr(e instanceof Error ? e.message : "Load failed");
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, profession }),
      });

      const data = (await res.json()) as { access_token?: string; csrf_token?: string };
      if (data.access_token) setAccessToken(data.access_token);
      if (data.csrf_token) setCsrfToken(data.csrf_token);
      router.push("/onboarding");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-[32px] p-7 space-y-4">
        <div className="text-center">
          <p className="step-label">01 — Create profile</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em]">Register</h1>
          <p className="mt-2 text-sm text-slate-300">Set your role once and start practicing.</p>
        </div>

        {err && <div className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">{err}</div>}

        <input className="input-dark" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="input-dark" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="input-dark" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />

        <select className="input-dark" value={profession} onChange={(e) => setProfession(e.target.value)}>
          {professions.map((p) => (
            <option key={p} value={p} className="text-black">
              {p}
            </option>
          ))}
        </select>

        <button className="btn-primary w-full" disabled={!profession || loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <a href="/login" className="block text-center text-sm font-medium text-cyan-300">
          Already have an account? Login
        </a>
      </form>
    </main>
  );
}