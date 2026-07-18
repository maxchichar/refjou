import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  bio: text("bio").default(""),
  avatarEmoji: text("avatar_emoji").default("🌱"),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  freezeTokens: integer("freeze_tokens").notNull().default(1),
  lastFreezeGrantWeek: text("last_freeze_grant_week").default(""),
  lastReflectionDate: text("last_reflection_date").default(""),
  createdAt: text("created_at").notNull(),
});

export const reflections = sqliteTable("reflections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  content: text("content").notNull(),
  proudOf: text("proud_of").default(""),
  improveTomorrow: text("improve_tomorrow").default(""),
  meditated: integer("meditated", { mode: "boolean" }).notNull().default(false),
  mood: integer("mood").default(3),
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(false),
  usedFreeze: integer("used_freeze", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const likes = sqliteTable("likes", {
  id: text("id").primaryKey(),
  reflectionId: text("reflection_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  reflectionId: text("reflection_id").notNull(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

export const currentlyReading = sqliteTable("currently_reading", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  author: text("author").default(""),
  progressPercent: integer("progress_percent").default(0),
  createdAt: text("created_at").notNull(),
});

export const follows = sqliteTable("follows", {
  id: text("id").primaryKey(),
  followerId: text("follower_id").notNull(),
  followingId: text("following_id").notNull(),
  createdAt: text("created_at").notNull(),
});
