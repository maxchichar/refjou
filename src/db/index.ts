import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const dbPath = path.join(process.cwd(), "refjou.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Bootstrap tables if they don't exist yet. Using raw SQL here (instead of
// drizzle-kit migrations) keeps the scaffold dependency-light and easy to
// read end to end. For production, swap SQLite for Postgres (e.g. Neon or
// Vercel Postgres) since Vercel's serverless filesystem is not persistent.
sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_emoji TEXT DEFAULT '🌱',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  freeze_tokens INTEGER NOT NULL DEFAULT 1,
  last_freeze_grant_week TEXT DEFAULT '',
  last_reflection_date TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reflections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  proud_of TEXT DEFAULT '',
  improve_tomorrow TEXT DEFAULT '',
  meditated INTEGER NOT NULL DEFAULT 0,
  mood INTEGER DEFAULT 3,
  is_private INTEGER NOT NULL DEFAULT 0,
  used_freeze INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  reflection_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  reflection_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS currently_reading (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  progress_percent INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`);

export const db = drizzle(sqlite, { schema });
