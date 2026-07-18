import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to update what you're reading." }, { status: 401 });
  }

  const { title, author, progressPercent } = await req.json();
  if (!title || String(title).trim().length === 0) {
    return NextResponse.json({ error: "Enter a book title." }, { status: 400 });
  }

  const db = getDb();
  // One "currently reading" slot per user for simplicity, keyed by uid.
  await db
    .collection("currentlyReading")
    .doc(currentUser.uid)
    .set({
      userId: currentUser.uid,
      title,
      author: author || "",
      progressPercent: typeof progressPercent === "number" ? progressPercent : 0,
      updatedAt: new Date().toISOString(),
    });

  return NextResponse.json({ ok: true });
}
