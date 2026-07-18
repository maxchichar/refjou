import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getEnrichedReflections } from "@/lib/feed";
import ReflectionCard from "@/components/ReflectionCard";

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  const reflections = await getEnrichedReflections({ currentUserId: currentUser?.uid ?? null });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl italic text-paper">
          Reflect daily. Grow visibly.
        </h1>
        <p className="mt-2 text-muted">
          A one-a-day journal, out loud. Log what you did, what you&apos;re proud of, and what
          you&apos;ll improve then watch the streak build.
        </p>
        {!currentUser && (
          <Link
            href="/register"
            className="mt-4 inline-block rounded-full bg-ember px-4 py-2 font-medium text-ink transition hover:opacity-90"
          >
            Start your streak
          </Link>
        )}
      </div>

      {reflections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center text-muted">
          No reflections yet. Be the first to write one today.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reflections.map((r) => (
            <ReflectionCard key={r.id} reflection={r} />
          ))}
        </div>
      )}
    </div>
  );
}
