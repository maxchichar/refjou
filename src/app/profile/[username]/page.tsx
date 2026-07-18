import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, currentlyReading, follows } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getEnrichedReflections } from "@/lib/feed";
import ReflectionCard from "@/components/ReflectionCard";
import FollowButton from "@/components/FollowButton";
import ReadingWidget from "@/components/ReadingWidget";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const currentUser = await getCurrentUser();

  const [profileUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!profileUser) notFound();

  const isOwnProfile = currentUser?.id === profileUser.id;

  const [reading] = await db
    .select()
    .from(currentlyReading)
    .where(eq(currentlyReading.userId, profileUser.id))
    .limit(1);

  let isFollowing = false;
  if (currentUser && !isOwnProfile) {
    const rows = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, currentUser.id), eq(follows.followingId, profileUser.id)))
      .limit(1);
    isFollowing = rows.length > 0;
  }

  const reflections = await getEnrichedReflections({
    authorUsername: username,
    currentUserId: currentUser?.id ?? null,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-paper">
            {profileUser.avatarEmoji} {profileUser.name}
          </h1>
          <p className="text-muted">@{profileUser.username}</p>
          {profileUser.bio && <p className="mt-2 text-paper">{profileUser.bio}</p>}
        </div>
        {currentUser && !isOwnProfile && (
          <FollowButton username={profileUser.username} initiallyFollowing={isFollowing} />
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Stat label="Current streak" value={`🔥 ${profileUser.currentStreak}`} />
        <Stat label="Longest streak" value={`${profileUser.longestStreak}`} />
        <Stat label="Freeze tokens" value={`🧊 ${profileUser.freezeTokens}`} />
      </div>

      <div className="mt-5">
        <ReadingWidget
          isOwnProfile={isOwnProfile}
          initial={
            reading
              ? { title: reading.title, author: reading.author || "", progressPercent: reading.progressPercent || 0 }
              : null
          }
        />
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg italic text-paper">Reflections</h2>
      {reflections.length === 0 ? (
        <p className="text-muted">No reflections yet.</p>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface py-3">
      <p className="font-stat text-lg text-paper">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
