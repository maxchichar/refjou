import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const db = getDb();

  const doc = await db.collection("reflections").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Reflection not found." }, { status: 404 });
  }
  const r = doc.data()!;

  if (r.isPrivate && r.userId !== currentUser?.uid) {
    return NextResponse.json({ error: "Reflection not found." }, { status: 404 });
  }

  const [authorDoc, likedDoc, commentsSnap] = await Promise.all([
    db.collection("users").doc(r.userId).get(),
    currentUser
      ? db.collection("reflections").doc(id).collection("likes").doc(currentUser.uid).get()
      : Promise.resolve(null),
    db.collection("reflections").doc(id).collection("comments").orderBy("createdAt", "asc").get(),
  ]);

  const author = authorDoc.exists ? authorDoc.data()! : null;

  const comments = await Promise.all(
    commentsSnap.docs.map(async (c) => {
      const cd = c.data();
      const cAuthorDoc = await db.collection("users").doc(cd.userId).get();
      const cAuthor = cAuthorDoc.exists ? cAuthorDoc.data()! : null;
      return {
        id: c.id,
        content: cd.content,
        createdAt: cd.createdAt,
        author: cAuthor
          ? { username: cAuthor.username, name: cAuthor.name, avatarEmoji: cAuthor.avatarEmoji }
          : null,
      };
    })
  );

  return NextResponse.json({
    reflection: {
      id: doc.id,
      ...r,
      author: author
        ? {
            username: author.username,
            name: author.name,
            avatarEmoji: author.avatarEmoji,
            currentStreak: author.currentStreak,
          }
        : null,
      likeCount: r.likeCount ?? 0,
      commentCount: r.commentCount ?? 0,
      likedByMe: likedDoc ? likedDoc.exists : false,
      comments,
    },
  });
}
