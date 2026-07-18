import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reflections, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { applyReflection } from "@/lib/streak";
import { getEnrichedReflections } from "@/lib/feed";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") || undefined;

  const enriched = await getEnrichedReflections({
    authorUsername: username,
    currentUserId: currentUser?.id ?? null,
  });

  return NextResponse.json({ reflections: enriched });
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "You need to be signed in to post a reflection." }, { status: 401 });
  }

  const body = await req.json();
  const { content, proudOf, improveTomorrow, meditated, mood, isPrivate } = body;

  if (!content || String(content).trim().length === 0) {
    return NextResponse.json({ error: "Write something before posting." }, { status: 400 });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const existingToday = await db
    .select()
    .from(reflections)
    .where(and(eq(reflections.userId, currentUser.id), eq(reflections.date, todayStr)))
    .limit(1);
  if (existingToday.length > 0) {
    return NextResponse.json(
      { error: "You've already posted your reflection for today. Come back tomorrow!" },
      { status: 409 }
    );
  }

  const streakResult = applyReflection(
    {
      currentStreak: currentUser.currentStreak,
      longestStreak: currentUser.longestStreak,
      freezeTokens: currentUser.freezeTokens,
      lastReflectionDate: currentUser.lastReflectionDate,
      lastFreezeGrantWeek: currentUser.lastFreezeGrantWeek,
    },
    todayStr
  );

  const id = randomUUID();
  await db.insert(reflections).values({
    id,
    userId: currentUser.id,
    date: todayStr,
    content,
    proudOf: proudOf || "",
    improveTomorrow: improveTomorrow || "",
    meditated: Boolean(meditated),
    mood: typeof mood === "number" ? mood : 3,
    isPrivate: Boolean(isPrivate),
    usedFreeze: streakResult.usedFreeze,
    createdAt: new Date().toISOString(),
  });

  await db
    .update(users)
    .set({
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      freezeTokens: streakResult.freezeTokens,
      lastFreezeGrantWeek: streakResult.lastFreezeGrantWeek,
      lastReflectionDate: streakResult.lastReflectionDate,
    })
    .where(eq(users.id, currentUser.id));

  return NextResponse.json({
    ok: true,
    id,
    streak: streakResult.currentStreak,
    usedFreeze: streakResult.usedFreeze,
  });
}
