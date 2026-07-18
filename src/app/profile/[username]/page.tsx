import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebaseAdmin";
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
  const db = getDb();

  const usernameDoc = await db.collection("usernames").doc(username).get();
  if (!usernameDoc.exists) notFound();
  const profileUid = usernameDoc.data()!.uid as string;

  const profileDoc = await db.collection("users").doc(profileUid).get();
  if (!profileDoc.exists) notFound();
  const profileUser = profileDoc.data()!;

  const isOwnProfile = currentUser?.uid === profileUid;

  const [readingDoc, followDoc, reflections] = await Promise.all([
    db.collection("currentlyReading").doc(profileUid).get(),
    currentUser && !isOwnProfile
      ? db.collection("follows").doc(`${currentUser.uid}_${profileUid}`).get()
      : Promise.resolve(null),
    getEnrichedReflections({ authorUsername: username, currentUserId: currentUser?.uid ?? null }),
  ]);

  const reading = readingDoc.exists ? readingDoc.data()! : null;
  const isFollowing = followDoc ? followDoc.exists : false;

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
        <Stat label="Current streak" value={`🔥 ${profileUser.currentStreak ?? 0}`} />
        <Stat label="Longest streak" value={`${profileUser.longestStreak ?? 0}`} />
        <Stat label="Freeze tokens" value={`🧊 ${profileUser.freezeTokens ?? 0}`} />
      </div>

      <div className="mt-5">
        <ReadingWidget
          isOwnProfile={isOwnProfile}
          initial={
            reading
              ? {
                  title: reading.title,
                  author: reading.author || "",
                  progressPercent: reading.progressPercent || 0,
                }
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
