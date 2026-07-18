import { getDb } from "@/lib/firebaseAdmin";

export type EnrichedReflection = {
  id: string;
  userId: string;
  date: string;
  content: string;
  proudOf: string;
  improveTomorrow: string;
  meditated: boolean;
  mood: number;
  isPrivate: boolean;
  usedFreeze: boolean;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  author: {
    username: string;
    name: string;
    avatarEmoji: string;
    currentStreak: number;
  } | null;
};

export async function getEnrichedReflections(opts: {
  authorUsername?: string;
  currentUserId?: string | null;
  limit?: number;
}): Promise<EnrichedReflection[]> {
  const { authorUsername, currentUserId, limit = 50 } = opts;
  const db = getDb();

  type Query = FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
  let query: Query = db.collection("reflections").orderBy("date", "desc").orderBy("createdAt", "desc");

  if (authorUsername) {
    const usernameDoc = await db.collection("usernames").doc(authorUsername).get();
    if (!usernameDoc.exists) return [];
    const authorUid = usernameDoc.data()!.uid as string;

    query = query.where("userId", "==", authorUid);
    if (currentUserId !== authorUid) {
      query = query.where("isPrivate", "==", false);
    }
  } else {
    query = query.where("isPrivate", "==", false).limit(limit);
  }

  const snapshot = await query.get();

  const enriched = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const r = doc.data();

      const [authorDoc, likedDoc] = await Promise.all([
        db.collection("users").doc(r.userId).get(),
        currentUserId
          ? db.collection("reflections").doc(doc.id).collection("likes").doc(currentUserId).get()
          : Promise.resolve(null),
      ]);

      const author = authorDoc.exists ? authorDoc.data()! : null;

      return {
        id: doc.id,
        userId: r.userId,
        date: r.date,
        content: r.content,
        proudOf: r.proudOf ?? "",
        improveTomorrow: r.improveTomorrow ?? "",
        meditated: Boolean(r.meditated),
        mood: r.mood ?? 3,
        isPrivate: Boolean(r.isPrivate),
        usedFreeze: Boolean(r.usedFreeze),
        createdAt: r.createdAt,
        likeCount: r.likeCount ?? 0,
        commentCount: r.commentCount ?? 0,
        likedByMe: likedDoc ? likedDoc.exists : false,
        author: author
          ? {
              username: author.username,
              name: author.name,
              avatarEmoji: author.avatarEmoji ?? "🌱",
              currentStreak: author.currentStreak ?? 0,
            }
          : null,
      };
    })
  );

  return enriched;
}
