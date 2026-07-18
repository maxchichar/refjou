import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const { content } = await req.json();
  if (!content || String(content).trim().length === 0) {
    return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });
  }

  const commentId = randomUUID();
  await db.insert(comments).values({
    id: commentId,
    reflectionId: id,
    userId: currentUser.id,
    content,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    comment: {
      id: commentId,
      content,
      createdAt: new Date().toISOString(),
      author: {
        username: currentUser.username,
        name: currentUser.name,
        avatarEmoji: currentUser.avatarEmoji,
      },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db.select().from(comments).where(eq(comments.reflectionId, id));
  const enriched = await Promise.all(
    rows.map(async (c) => {
      const [author] = await db.select().from(users).where(eq(users.id, c.userId)).limit(1);
      return { ...c, author };
    })
  );
  return NextResponse.json({ comments: enriched });
}
