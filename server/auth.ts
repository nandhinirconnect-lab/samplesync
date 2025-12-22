import crypto from 'crypto';

// Generate 12-character alphanumeric event ID
export function generateEventId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return crypto
    .createHash('sha256')
    .update(password + process.env.PASSWORD_SALT || 'default-salt')
    .digest('hex');
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = crypto
    .createHash('sha256')
    .update(password + process.env.PASSWORD_SALT || 'default-salt')
    .digest('hex');
  return computed === hash;
}

// Generate JWT-like token (simple session token)
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
