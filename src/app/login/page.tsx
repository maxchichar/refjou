"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-2xl italic text-paper">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Keep the streak going.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Email</span>
          <input
            type="email"
            className="w-full rounded bg-surface px-3 py-2 text-paper placeholder:text-muted"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Password</span>
          <input
            type="password"
            className="w-full rounded bg-surface px-3 py-2 text-paper placeholder:text-muted"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          disabled={loading}
          className="rounded-full bg-ember px-4 py-2 font-medium text-ink transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="text-ember hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
