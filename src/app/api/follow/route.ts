import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { follows, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to follow people." }, { status: 401 });
  }

  const { username } = await req.json();
  const [target] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (target.id === currentUser.id) {
    return NextResponse.json({ error: "You can't follow yourself." }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, currentUser.id), eq(follows.followingId, target.id)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(follows).where(eq(follows.id, existing[0].id));
    return NextResponse.json({ following: false });
  } else {
    await db.insert(follows).values({
      id: randomUUID(),
      followerId: currentUser.id,
      followingId: target.id,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ following: true });
  }
}
