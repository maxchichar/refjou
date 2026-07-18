import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getCurrentUser } from "@/lib/auth";
import { applyReflection } from "@/lib/streak";
import { getEnrichedReflections } from "@/lib/feed";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") || undefined;

  const enriched = await getEnrichedReflections({
    authorUsername: username,
    currentUserId: currentUser?.uid ?? null,
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

  const db = getDb();
  const todayStr = new Date().toISOString().slice(0, 10);
  const userRef = db.collection("users").doc(currentUser.uid);

  const existingToday = await db
    .collection("reflections")
    .where("userId", "==", currentUser.uid)
    .where("date", "==", todayStr)
    .limit(1)
    .get();

  if (!existingToday.empty) {
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

  const reflectionRef = db.collection("reflections").doc();

  await db.runTransaction(async (tx) => {
    tx.set(reflectionRef, {
      userId: currentUser.uid,
      date: todayStr,
      content,
      proudOf: proudOf || "",
      improveTomorrow: improveTomorrow || "",
      meditated: Boolean(meditated),
      mood: typeof mood === "number" ? mood : 3,
      isPrivate: Boolean(isPrivate),
      usedFreeze: streakResult.usedFreeze,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    });

    tx.update(userRef, {
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      freezeTokens: streakResult.freezeTokens,
      lastFreezeGrantWeek: streakResult.lastFreezeGrantWeek,
      lastReflectionDate: streakResult.lastReflectionDate,
    });
  });

  return NextResponse.json({
    ok: true,
    id: reflectionRef.id,
    streak: streakResult.currentStreak,
    usedFreeze: streakResult.usedFreeze,
  });
}
