import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reflections, users, likes, comments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const [reflection] = await db.select().from(reflections).where(eq(reflections.id, id)).limit(1);
  if (!reflection) {
    return NextResponse.json({ error: "Reflection not found." }, { status: 404 });
  }

  const [author] = await db.select().from(users).where(eq(users.id, reflection.userId)).limit(1);
  const likeRows = await db.select().from(likes).where(eq(likes.reflectionId, id));
  const commentRows = await db.select().from(comments).where(eq(comments.reflectionId, id));

  const commentsWithAuthors = await Promise.all(
    commentRows.map(async (c) => {
      const [cAuthor] = await db.select().from(users).where(eq(users.id, c.userId)).limit(1);
      return {
        ...c,
        author: cAuthor
          ? { username: cAuthor.username, name: cAuthor.name, avatarEmoji: cAuthor.avatarEmoji }
          : null,
      };
    })
  );

  return NextResponse.json({
    reflection: {
      ...reflection,
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
      likedByMe: currentUser ? likeRows.some((l) => l.userId === currentUser.id) : false,
      comments: commentsWithAuthors,
    },
  });
}
