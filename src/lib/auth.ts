import { cookies } from "next/headers";
import { getAdminAuth, getDb } from "@/lib/firebaseAdmin";

const COOKIE_NAME = "refjou_session";
const SESSION_EXPIRES_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type SessionUser = {
  uid: string;
  username: string;
  name: string;
  bio: string;
  avatarEmoji: string;
  currentStreak: number;
  longestStreak: number;
  freezeTokens: number;
  lastFreezeGrantWeek: string;
  lastReflectionDate: string | null;
};

/** Exchanges a client-side Firebase ID token for a long-lived httpOnly session cookie. */
export async function createSessionCookie(idToken: string) {
  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_MS,
  });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRES_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Verifies the session cookie and loads the matching Firestore user profile. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const doc = await getDb().collection("users").doc(decoded.uid).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    return {
      uid: decoded.uid,
      username: data.username,
      name: data.name,
      bio: data.bio ?? "",
      avatarEmoji: data.avatarEmoji ?? "🌱",
      currentStreak: data.currentStreak ?? 0,
      longestStreak: data.longestStreak ?? 0,
      freezeTokens: data.freezeTokens ?? 1,
      lastFreezeGrantWeek: data.lastFreezeGrantWeek ?? "",
      lastReflectionDate: data.lastReflectionDate ?? null,
    };
  } catch {
    return null;
  }
}
