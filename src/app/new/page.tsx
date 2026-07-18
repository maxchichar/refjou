"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MOODS = [
  { value: 1, emoji: "😔" },
  { value: 2, emoji: "😕" },
  { value: 3, emoji: "😐" },
  { value: 4, emoji: "🙂" },
  { value: 5, emoji: "😄" },
];

export default function NewReflectionPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [proudOf, setProudOf] = useState("");
  const [improveTomorrow, setImproveTomorrow] = useState("");
  const [meditated, setMeditated] = useState(false);
  const [mood, setMood] = useState(3);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, proudOf, improveTomorrow, meditated, mood, isPrivate }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
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
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-2xl italic text-paper">Today&apos;s reflection</h1>
      <p className="mt-1 text-sm text-muted">
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">How did today go?</span>
          <textarea
            className="min-h-32 w-full rounded bg-surface px-3 py-2 text-paper placeholder:text-muted"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Walk through your day, what you did, how you felt and what stood out."
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-moss">What are you proud of?</span>
            <input
              className="w-full rounded bg-surface px-3 py-2 text-paper placeholder:text-muted"
              value={proudOf}
              onChange={(e) => setProudOf(e.target.value)}
              placeholder="Finished the report early"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ember">What will you improve tomorrow?</span>
            <input
              className="w-full rounded bg-surface px-3 py-2 text-paper placeholder:text-muted"
              value={improveTomorrow}
              onChange={(e) => setImproveTomorrow(e.target.value)}
              placeholder="Get to bed earlier"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={meditated}
              onChange={(e) => setMeditated(e.target.checked)}
              className="h-4 w-4 accent-ember"
            />
            🧘 I meditated today
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 accent-ember"
            />
            🔒 Keep this entry private
          </label>
        </div>

        <div>
          <span className="text-sm text-muted">Mood</span>
          <div className="mt-1 flex gap-2">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`rounded-full px-3 py-2 text-lg transition ${
                  mood === m.value ? "bg-ember-dim ring-1 ring-ember" : "bg-surface"
                }`}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          disabled={loading}
          className="self-start rounded-full bg-ember px-5 py-2 font-medium text-ink transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Posting…" : "Post reflection"}
        </button>
      </form>
    </div>
  );
}
