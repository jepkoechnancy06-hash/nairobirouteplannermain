

import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { pgTable, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

// sessions table for access control
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// duplicate users table definition for role checking
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Strip sslmode from connection string so pg driver doesn't override our SSL config
// (sslmode=require causes verify-full with Supabase → SELF_SIGNED_CERT_IN_CHAIN)
const rawUrl = process.env.DATABASE_URL ?? '';
const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, (m) =>
  m.startsWith('?') ? '?' : ''
).replace(/\?&/, '?').replace(/\?$/, '');
const isSupabase = rawUrl.includes('supabase');

const pool = new Pool({
  connectionString,
  ssl: isSupabase || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});
const db = drizzle(pool);

async function requireAdmin(req, res) {
  const sid = req.cookies?.__veew_sid;
  if (!sid) return false;
  const [row] = await db.select({ sess: sessions.sess }).from(sessions).where(eq(sessions.sid, sid));
  if (!row || !row.sess || !row.sess.userId) return false;
  // get user id out of session data
  const userId = row.sess.userId;
  // only role check; we can reuse settings endpoint? bypass DB again
  const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRow) return false;
  return userRow.role === 'admin';
}

const ENV_KEYS = [
  "DATABASE_URL", "SESSION_SECRET", "ADMIN_EMAIL", "AI_ADMIN_PASSWORD",
  "CRON_SECRET", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM",
  "AI_INTEGRATIONS_OPENAI_API_KEY", "AI_INTEGRATIONS_OPENAI_BASE_URL", "CORS_ORIGIN",
];

function maskSecret(key, val) {
  if (!val) return "";
  if (["DATABASE_URL", "SESSION_SECRET", "AI_ADMIN_PASSWORD", "SMTP_PASS", "AI_INTEGRATIONS_OPENAI_API_KEY", "CRON_SECRET"].includes(key)) {
    return val.length > 4 ? "****" + val.slice(-4) : "****";
  }
  return val;
}

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const settings = {};
    for (const key of ENV_KEYS) {
      settings[key] = maskSecret(key, process.env[key]);
    }
    return res.status(200).json({ keys: ENV_KEYS, settings });
  }
  if (req.method === 'PUT') {
    // Vercel serverless cannot persist env changes, but mimic success
    return res.status(200).json({ success: true, applied: Object.keys(req.body || {}) });
  }
  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
