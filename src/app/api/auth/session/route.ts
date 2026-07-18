import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getDb } from "@/lib/firebaseAdmin";
import { createSessionCookie } from "@/lib/auth";
import type { Firestore } from "firebase-admin/firestore";

function sanitizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

/** Finds a free username starting from `base`, appending numbers/a random
 * suffix if it's taken. Used to auto-provision a profile on first Google
 * sign-in, where we only have an email/display name to work with. */
async function findAvailableUsername(db: Firestore, base: string): Promise<string> {
  const cleanBase = sanitizeUsername(base).slice(0, 20) || "user";

  const candidates = [cleanBase, ...Array.from({ length: 8 }, (_, i) => `${cleanBase}${i + 1}`)];
  for (const candidate of candidates) {
    const doc = await db.collection("usernames").doc(candidate).get();
    if (!doc.exists) return candidate;
  }
  // Extremely unlikely fallback: random suffix.
  return `${cleanBase}${Math.random().toString(36).slice(2, 6)}`;
}

async function createProfile(
  db: Firestore,
  uid: string,
  cleanUsername: string,
  name: string
) {
  const usernameRef = db.collection("usernames").doc(cleanUsername);
  await db.runTransaction(async (tx) => {
    const existing = await tx.get(usernameRef);
    if (existing.exists) {
      throw new Error("USERNAME_TAKEN");
    }
    tx.set(usernameRef, { uid });
    tx.set(db.collection("users").doc(uid), {
      username: cleanUsername,
      name,
      bio: "",
      avatarEmoji: "🌱",
      currentStreak: 0,
      longestStreak: 0,
      freezeTokens: 1,
      lastFreezeGrantWeek: "",
      lastReflectionDate: null,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function POST(req: NextRequest) {
  const { idToken, mode, name, username } = await req.json();

  if (!idToken) {
    return NextResponse.json({ error: "Missing ID token." }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid or expired sign-in. Try again." }, { status: 401 });
  }

  const db = getDb();
  const uid = decoded.uid;

  if (mode === "register") {
    if (!name || !username) {
      return NextResponse.json({ error: "Name and username are required." }, { status: 400 });
    }
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Choose a username using letters, numbers, or underscores." },
        { status: 400 }
      );
    }

    try {
      await createProfile(db, uid, cleanUsername, name);
    } catch (err) {
      // Roll back the Firebase Auth user so they don't end up with an
      // account that has no matching Firestore profile.
      await getAdminAuth()
        .deleteUser(uid)
        .catch(() => {});
      if (err instanceof Error && err.message === "USERNAME_TAKEN") {
        return NextResponse.json({ error: "That username is taken." }, { status: 409 });
      }
      return NextResponse.json({ error: "Something went wrong creating your account." }, { status: 500 });
    }
  } else if (mode === "google") {
    // Google sign-in covers both "log in" and "sign up" — auto-provision a
    // profile the first time we see this uid.
    const existingProfile = await db.collection("users").doc(uid).get();
    if (!existingProfile.exists) {
      const displayName = decoded.name || decoded.email?.split("@")[0] || "New user";
      const usernameBase = decoded.email?.split("@")[0] || displayName;
      const cleanUsername = await findAvailableUsername(db, usernameBase);
      try {
        await createProfile(db, uid, cleanUsername, displayName);
      } catch {
        return NextResponse.json(
          { error: "Something went wrong setting up your account. Try again." },
          { status: 500 }
        );
      }
    }
  } else {
    // Login: the Firestore profile should already exist.
    const profile = await db.collection("users").doc(uid).get();
    if (!profile.exists) {
      return NextResponse.json(
        { error: "No profile found for this account. Try registering instead." },
        { status: 404 }
      );
    }
  }

  await createSessionCookie(idToken);
  return NextResponse.json({ ok: true });
}