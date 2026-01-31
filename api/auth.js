/**
 * Authentication endpoint for Parental Login/Signup
 * Simple auth system using query parameters (for Vercel Functions)
 * In production, use JWT + secure session management
 */

import crypto from 'crypto';

// In-memory store (replace with database in production)
// For MVP, we'll use environment variable as a "database"
let users = {};

// Initialize from environment variable if available
if (process.env.USERS_DB) {
  try {
    users = JSON.parse(process.env.USERS_DB);
  } catch (e) {
    console.error('Failed to parse USERS_DB:', e);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'superchore-salt').digest('hex');
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, email, password } = req.body || {};

  try {
    if (action === 'signup') {
      // Register new parental account
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      if (users[email]) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hashedPassword = hashPassword(password);
      users[email] = {
        hashedPassword,
        createdAt: new Date().toISOString(),
        children: [],
        data: {},
      };

      // TODO: Persist users to database
      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token: Buffer.from(email).toString('base64'),
      });
    }

    if (action === 'login') {
      // Verify parental login
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const user = users[email];
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const hashedPassword = hashPassword(password);
      if (user.hashedPassword !== hashedPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: Buffer.from(email).toString('base64'),
        user: {
          email,
          children: user.children,
        },
      });
    }

    if (action === 'verify-token') {
      // Verify and decode token
      const { token } = req.body;
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      try {
        const email = Buffer.from(token, 'base64').toString('utf-8');
        if (users[email]) {
          return res.status(200).json({ success: true, email });
        }
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
