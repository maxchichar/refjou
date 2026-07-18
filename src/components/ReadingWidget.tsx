"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReadingWidget({
  isOwnProfile,
  initial,
}: {
  isOwnProfile: boolean;
  initial: { title: string; author: string; progressPercent: number } | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initial?.title || "");
  const [author, setAuthor] = useState(initial?.author || "");
  const [progress, setProgress] = useState(initial?.progressPercent || 0);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, progressPercent: progress }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!initial && !isOwnProfile) return null;

  if (editing) {
    return (
      <div className="rounded-lg bg-surface p-4">
        <p className="text-sm text-muted">📖 Currently reading</p>
        <div className="mt-2 flex flex-col gap-2">
          <input
            className="rounded bg-surface-raised px-3 py-1.5 text-sm text-paper placeholder:text-muted"
            placeholder="Book title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="rounded bg-surface-raised px-3 py-1.5 text-sm text-paper placeholder:text-muted"
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <label className="text-xs text-muted">
            Progress: {progress}%
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-ember"
            />
          </label>
          <div className="flex gap-2">
            <button
              disabled={loading || !title}
              onClick={save}
              className="rounded-full bg-ember px-3 py-1 text-xs font-medium text-ink disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-full bg-surface-raised px-3 py-1 text-xs text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">📖 Currently reading</p>
        {isOwnProfile && (
          <button onClick={() => setEditing(true)} className="text-xs text-ember hover:underline">
            {initial ? "Edit" : "Add a book"}
          </button>
        )}
      </div>
      {initial ? (
        <>
          <p className="mt-1 font-display italic text-paper">{initial.title}</p>
          {initial.author && <p className="text-sm text-muted">{initial.author}</p>}
          <div className="mt-2 h-1.5 w-full rounded-full bg-surface-raised">
            <div
              className="h-1.5 rounded-full bg-moss"
              style={{ width: `${initial.progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">{initial.progressPercent}% done</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted">No book added yet.</p>
      )}
    </div>
  );
}
