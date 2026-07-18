"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebaseClient";

type MeUser = {
  username: string;
  name: string;
  avatarEmoji: string;
  currentStreak: number;
  longestStreak: number;
  freezeTokens: number;
};

export default function Navbar() {
  const [user, setUser] = useState<MeUser | null | undefined>(undefined);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut(clientAuth()).catch(() => {});
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-xl tracking-tight text-paper">
          refjou<span className="text-ember">.</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {user === undefined ? null : user ? (
            <>
              <span
                title={`Longest streak: ${user.longestStreak} · Freeze tokens: ${user.freezeTokens}`}
                className="font-stat flex items-center gap-1 text-ember"
              >
                🔥 {user.currentStreak}
              </span>
              <Link
                href="/new"
                className="rounded-full bg-ember px-3 py-1.5 font-medium text-ink transition hover:opacity-90"
              >
                Reflect
              </Link>
              <Link href={`/profile/${user.username}`} className="text-paper hover:text-ember">
                {user.avatarEmoji} {user.username}
              </Link>
              <button onClick={handleLogout} className="text-muted hover:text-paper">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-paper hover:text-ember">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-ember px-3 py-1.5 font-medium text-ink transition hover:opacity-90"
              >
                Join refjou
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
