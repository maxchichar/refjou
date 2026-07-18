import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebaseAdmin";
import { getCurrentUser } from "@/lib/auth";
import { getEnrichedReflections } from "@/lib/feed";
import ReflectionCard from "@/components/ReflectionCard";
import CommentSection from "@/components/CommentSection";

export default async function ReflectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const db = getDb();

  const doc = await db.collection("reflections").doc(id).get();
  if (!doc.exists) notFound();
  const reflection = doc.data()!;

  if (reflection.isPrivate && reflection.userId !== currentUser?.uid) {
    notFound();
  }

  const publicFeed = await getEnrichedReflections({ currentUserId: currentUser?.uid ?? null });
  let enriched = publicFeed.find((r) => r.id === id);

  if (!enriched) {
    // Private entry viewed by its owner won't be in the public feed list above.
    const authorDoc = await db.collection("users").doc(reflection.userId).get();
    const author = authorDoc.exists ? authorDoc.data()! : null;
    const likedDoc = currentUser
      ? await db.collection("reflections").doc(id).collection("likes").doc(currentUser.uid).get()
      : null;

    enriched = {
      id,
      userId: reflection.userId,
      date: reflection.date,
      content: reflection.content,
      proudOf: reflection.proudOf ?? "",
      improveTomorrow: reflection.improveTomorrow ?? "",
      meditated: Boolean(reflection.meditated),
      mood: reflection.mood ?? 3,
      isPrivate: Boolean(reflection.isPrivate),
      usedFreeze: Boolean(reflection.usedFreeze),
      createdAt: reflection.createdAt,
      likeCount: reflection.likeCount ?? 0,
      commentCount: reflection.commentCount ?? 0,
      likedByMe: likedDoc ? likedDoc.exists : false,
      author: author
        ? {
            username: author.username,
            name: author.name,
            avatarEmoji: author.avatarEmoji,
            currentStreak: author.currentStreak,
          }
        : null,
    };
  }

  const commentsSnap = await db
    .collection("reflections")
    .doc(id)
    .collection("comments")
    .orderBy("createdAt", "asc")
    .get();

  const commentsWithAuthors = await Promise.all(
    commentsSnap.docs.map(async (c) => {
      const cd = c.data();
      const authorDoc = await db.collection("users").doc(cd.userId).get();
      const author = authorDoc.exists ? authorDoc.data()! : null;
      return {
        id: c.id,
        content: cd.content,
        createdAt: cd.createdAt,
        author: author
          ? { username: author.username, name: author.name, avatarEmoji: author.avatarEmoji }
          : null,
      };
    })
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ReflectionCard reflection={enriched} />
      <CommentSection
        reflectionId={id}
        initialComments={commentsWithAuthors}
        isSignedIn={Boolean(currentUser)}
      />
    </div>
  );
}
