"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { username: string; name: string; avatarEmoji: string | null } | null;
};

export default function CommentSection({
  reflectionId,
  initialComments,
  isSignedIn,
}: {
  reflectionId: string;
  initialComments: Comment[];
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reflections/${reflectionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((c) => [...c, data.comment]);
        setContent("");
      } else if (res.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 font-display italic text-paper">Comments</h2>
      <div className="flex flex-col gap-3">
        {comments.length === 0 && <p className="text-sm text-muted">No comments yet.</p>}
        {comments.map((c) => (
          <div key={c.id} className="rounded bg-surface px-3 py-2 text-sm">
            <span className="font-medium text-paper">
              {c.author?.avatarEmoji} {c.author?.name}
            </span>{" "}
            <span className="text-paper">{c.content}</span>
          </div>
        ))}
      </div>

      {isSignedIn ? (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded bg-surface px-3 py-2 text-sm text-paper placeholder:text-muted"
            placeholder="Add an encouraging word…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            disabled={loading}
            className="rounded-full bg-ember px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted">Log in to leave a comment.</p>
      )}
    </div>
  );
}
