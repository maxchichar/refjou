import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to follow people." }, { status: 401 });
  }

  const { username } = await req.json();
  const db = getDb();

  const usernameDoc = await db.collection("usernames").doc(username).get();
  if (!usernameDoc.exists) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const targetUid = usernameDoc.data()!.uid as string;

  if (targetUid === currentUser.uid) {
    return NextResponse.json({ error: "You can't follow yourself." }, { status: 400 });
  }

  const followId = `${currentUser.uid}_${targetUid}`;
  const followRef = db.collection("follows").doc(followId);
  const existing = await followRef.get();

  if (existing.exists) {
    await followRef.delete();
    return NextResponse.json({ following: false });
  } else {
    await followRef.set({
      followerId: currentUser.uid,
      followingId: targetUid,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ following: true });
  }
}
