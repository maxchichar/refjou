import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { currentlyReading } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to update what you're reading." }, { status: 401 });
  }

  const { title, author, progressPercent } = await req.json();
  if (!title || String(title).trim().length === 0) {
    return NextResponse.json({ error: "Enter a book title." }, { status: 400 });
  }

  // One "currently reading" slot per user for simplicity: replace any existing one.
  await db.delete(currentlyReading).where(eq(currentlyReading.userId, currentUser.id));
  await db.insert(currentlyReading).values({
    id: randomUUID(),
    userId: currentUser.id,
    title,
    author: author || "",
    progressPercent: typeof progressPercent === "number" ? progressPercent : 0,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
