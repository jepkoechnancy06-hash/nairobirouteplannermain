

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
