import { notFound } from "next/navigation";
import { db } from "@/db";
import { reflections, users, comments as commentsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
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

  const [reflection] = await db.select().from(reflections).where(eq(reflections.id, id)).limit(1);
  if (!reflection) notFound();

  if (reflection.isPrivate && reflection.userId !== currentUser?.id) {
    notFound();
  }

  const [enriched] = await getEnrichedReflections({ currentUserId: currentUser?.id ?? null }).then(
    async (list) => {
      const found = list.find((r) => r.id === id);
      if (found) return [found];
      // Fallback for private entries viewed by their owner (not in public feed list)
      const [author] = await db.select().from(users).where(eq(users.id, reflection.userId)).limit(1);
      return [
        {
          ...reflection,
          author: author
            ? {
                username: author.username,
                name: author.name,
                avatarEmoji: author.avatarEmoji,
                currentStreak: author.currentStreak,
              }
            : null,
          likeCount: 0,
          commentCount: 0,
          likedByMe: false,
        },
      ];
    }
  );

  const commentRows = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.reflectionId, id));
  const commentsWithAuthors = await Promise.all(
    commentRows.map(async (c) => {
      const [author] = await db.select().from(users).where(eq(users.id, c.userId)).limit(1);
      return {
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
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
