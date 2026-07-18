import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, username, email, password } = body;

  if (!name || !username || !email || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!cleanUsername) {
    return NextResponse.json({ error: "Choose a username using letters, numbers, or underscores." }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, cleanUsername))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "That username is taken." }, { status: 409 });
  }

  const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingEmail.length > 0) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const id = randomUUID();

  await db.insert(users).values({
    id,
    username: cleanUsername,
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  await setSessionCookie(id);

  return NextResponse.json({ ok: true, username: cleanUsername });
}
