import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await setSessionCookie(user.id);

  return NextResponse.json({ ok: true, username: user.username });
}
