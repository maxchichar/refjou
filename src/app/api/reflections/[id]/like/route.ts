import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to like reflections." }, { status: 401 });
  }

  const existing = await db
    .select()
    .from(likes)
    .where(and(eq(likes.reflectionId, id), eq(likes.userId, currentUser.id)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(likes).where(eq(likes.id, existing[0].id));
    return NextResponse.json({ liked: false });
  } else {
    await db.insert(likes).values({
      id: randomUUID(),
      reflectionId: id,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ liked: true });
  }
}
