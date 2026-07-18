"use client";

import { useState } from "react";

export default function FollowButton({
  username,
  initiallyFollowing,
}: {
  username: string;
  initiallyFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const prev = following;
    setFollowing(!prev);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFollowing(prev);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        following ? "bg-surface text-paper" : "bg-ember text-ink hover:opacity-90"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
