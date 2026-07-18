import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const { content } = await req.json();
  if (!content || String(content).trim().length === 0) {
    return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });
  }

  const db = getDb();
  const reflectionRef = db.collection("reflections").doc(id);
  const commentRef = reflectionRef.collection("comments").doc();
  const createdAt = new Date().toISOString();

  try {
    await db.runTransaction(async (tx) => {
      const reflectionDoc = await tx.get(reflectionRef);
      if (!reflectionDoc.exists) {
        throw new Error("NOT_FOUND");
      }
      tx.set(commentRef, {
        userId: currentUser.uid,
        content,
        createdAt,
      });
      tx.update(reflectionRef, { commentCount: FieldValue.increment(1) });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Reflection not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Something went wrong posting your comment." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    comment: {
      id: commentRef.id,
      content,
      createdAt,
      author: {
        username: currentUser.username,
        name: currentUser.name,
        avatarEmoji: currentUser.avatarEmoji,
      },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const snap = await db
    .collection("reflections")
    .doc(id)
    .collection("comments")
    .orderBy("createdAt", "asc")
    .get();

  const comments = await Promise.all(
    snap.docs.map(async (c) => {
      const cd = c.data();
      const authorDoc = await db.collection("users").doc(cd.userId).get();
      return { id: c.id, ...cd, author: authorDoc.exists ? authorDoc.data() : null };
    })
  );

  return NextResponse.json({ comments });
}
