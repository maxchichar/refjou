import { db } from "@/db";
import { reflections, users, likes, comments } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getEnrichedReflections(opts: {
  authorUsername?: string;
  currentUserId?: string | null;
  limit?: number;
}) {
  const { authorUsername, currentUserId, limit = 50 } = opts;

  let rows;
  if (authorUsername) {
    const [author] = await db.select().from(users).where(eq(users.username, authorUsername)).limit(1);
    if (!author) return [];
    const whereClause = currentUserId === author.id
      ? eq(reflections.userId, author.id)
      : and(eq(reflections.userId, author.id), eq(reflections.isPrivate, false));
    rows = await db
      .select()
      .from(reflections)
      .where(whereClause)
      .orderBy(desc(reflections.date), desc(reflections.createdAt));
  } else {
    rows = await db
      .select()
      .from(reflections)
      .where(eq(reflections.isPrivate, false))
      .orderBy(desc(reflections.date), desc(reflections.createdAt))
      .limit(limit);
  }

  const enriched = await Promise.all(
    rows.map(async (r) => {
      const [author] = await db.select().from(users).where(eq(users.id, r.userId)).limit(1);
      const likeRows = await db.select().from(likes).where(eq(likes.reflectionId, r.id));
      const commentRows = await db.select().from(comments).where(eq(comments.reflectionId, r.id));

      return {
        ...r,
        author: author
          ? {
              username: author.username,
              name: author.name,
              avatarEmoji: author.avatarEmoji,
              currentStreak: author.currentStreak,
            }
          : null,
        likeCount: likeRows.length,
        commentCount: commentRows.length,
        likedByMe: currentUserId ? likeRows.some((l) => l.userId === currentUserId) : false,
      };
    })
  );

  return enriched;
}
