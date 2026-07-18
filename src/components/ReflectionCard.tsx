"use client";

import Link from "next/link";
import { useState } from "react";

export type ReflectionData = {
  id: string;
  date: string;
  content: string;
  proudOf?: string | null;
  improveTomorrow?: string | null;
  meditated: boolean;
  mood?: number | null;
  usedFreeze: boolean;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  author: {
    username: string;
    name: string;
    avatarEmoji: string | null;
    currentStreak: number;
  } | null;
};

const MOOD_EMOJI: Record<number, string> = {
  1: "😔",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export default function ReflectionCard({ reflection }: { reflection: ReflectionData }) {
  const [liked, setLiked] = useState(reflection.likedByMe);
  const [likeCount, setLikeCount] = useState(reflection.likeCount);
  const [pending, setPending] = useState(false);

  async function toggleLike() {
    if (pending) return;
    setPending(true);
    const prevLiked = liked;
    setLiked(!prevLiked);
    setLikeCount((c) => c + (prevLiked ? -1 : 1));
    try {
      const res = await fetch(`/api/reflections/${reflection.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch {
      setLiked(prevLiked);
      setLikeCount((c) => c + (prevLiked ? 1 : -1));
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="entry-spine rounded-r-lg bg-surface pl-4 pr-5 py-4 transition">
      <div className="flex items-center justify-between text-sm text-muted">
        {reflection.author ? (
          <Link
            href={`/profile/${reflection.author.username}`}
            className="flex items-center gap-2 hover:text-paper"
          >
            <span>{reflection.author.avatarEmoji}</span>
            <span className="font-medium text-paper">{reflection.author.name}</span>
            <span className="font-stat text-ember">🔥{reflection.author.currentStreak}</span>
          </Link>
        ) : (
          <span>Unknown</span>
        )}
        <span className="font-stat">{reflection.date}</span>
      </div>

      <Link href={`/reflection/${reflection.id}`}>
        <p className="mt-3 whitespace-pre-wrap text-paper">{reflection.content}</p>
      </Link>

      {(reflection.proudOf || reflection.improveTomorrow) && (
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {reflection.proudOf && (
            <div className="rounded bg-surface-raised px-3 py-2">
              <span className="text-moss">Proud of · </span>
              <span className="text-paper">{reflection.proudOf}</span>
            </div>
          )}
          {reflection.improveTomorrow && (
            <div className="rounded bg-surface-raised px-3 py-2">
              <span className="text-ember">Improve · </span>
              <span className="text-paper">{reflection.improveTomorrow}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-sm text-muted">
        {reflection.meditated && <span title="Meditated today">🧘 meditated</span>}
        {reflection.mood && <span title="Mood">{MOOD_EMOJI[reflection.mood]}</span>}
        {reflection.usedFreeze && <span title="Streak freeze used">🧊 streak protected</span>}
      </div>

      <div className="mt-3 flex items-center gap-5 border-t border-line pt-3 text-sm">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 transition ${
            liked ? "text-ember" : "text-muted hover:text-ember"
          }`}
        >
          {liked ? "♥" : "♡"} {likeCount}
        </button>
        <Link href={`/reflection/${reflection.id}`} className="text-muted hover:text-paper">
          💬 {reflection.commentCount}
        </Link>
      </div>
    </article>
  );
}
