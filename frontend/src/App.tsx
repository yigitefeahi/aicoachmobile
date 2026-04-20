import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        const payload = (await response.json()) as HealthResponse;
        setHealth(payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      }
    };

    loadHealth();
  }, []);

  return (
    <main className="container">
      <h1>AI Coach App</h1>
      <p>Frontend + Backend baseline is ready.</p>

      <section className="card">
        <h2>API Health</h2>
        <p>
          Endpoint: <code>{apiBaseUrl}/health</code>
        </p>
        {health && <p className="ok">Status: {health.status}</p>}
        {error && <p className="error">Error: {error}</p>}
      </section>
    </main>
  );
}
