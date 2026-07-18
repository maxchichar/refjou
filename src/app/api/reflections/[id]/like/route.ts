import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to like reflections." }, { status: 401 });
  }

  const db = getDb();
  const reflectionRef = db.collection("reflections").doc(id);
  const likeRef = reflectionRef.collection("likes").doc(currentUser.uid);

  const liked = await db.runTransaction(async (tx) => {
    const likeDoc = await tx.get(likeRef);
    if (likeDoc.exists) {
      tx.delete(likeRef);
      tx.update(reflectionRef, { likeCount: FieldValue.increment(-1) });
      return false;
    } else {
      tx.set(likeRef, { createdAt: new Date().toISOString() });
      tx.update(reflectionRef, { likeCount: FieldValue.increment(1) });
      return true;
    }
  });

  return NextResponse.json({ liked });
}
