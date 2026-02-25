

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from '../../shared/models/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function requireAdmin(req, res) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    return decoded && decoded.role === 'admin';
  } catch {
    return false;
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Fetch users from DB
    const allUsers = await db.select().from(users);
    return res.status(200).json({ data: allUsers, pagination: { page: 1, limit: 50, count: allUsers.length, hasMore: false } });
  }

  if (req.method === 'POST') {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and a digit' });
    }
    // Only allow admin role for env admin
    if (role === 'admin' && email.toLowerCase() !== String(process.env.ADMIN_EMAIL).toLowerCase()) {
      return res.status(400).json({ error: 'Only the environment admin can have the admin role' });
    }
    // Check if user exists
    const existing = await db.select().from(users).where(users.email.eq(email.toLowerCase()));
    if (existing.length > 0) return res.status(409).json({ error: 'A user with this email already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      role: (role === 'admin' && email.toLowerCase() === String(process.env.ADMIN_EMAIL).toLowerCase()) ? 'admin' : (role === 'manager' ? 'manager' : 'user'),
    }).returning();
    const { passwordHash: _, ...userData } = newUser;
    return res.status(201).json(userData);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
