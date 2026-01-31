/**
 * Data Sync endpoint for cross-device persistence
 * Stores and retrieves chore data associated with parental account
 */

// In-memory data store (replace with database in production)
let dataStore = {};

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

  // Extract token from Authorization header
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    // Decode token to get email
    const email = Buffer.from(token, 'base64').toString('utf-8');

    if (req.method === 'POST') {
      // Save/update chore data for this account
      const { users, history, children } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Invalid token' });
      }

      dataStore[email] = {
        users,
        history,
        children,
        updatedAt: new Date().toISOString(),
      };

      return res.status(200).json({
        success: true,
        message: 'Data synced successfully',
      });
    }

    if (req.method === 'GET') {
      // Retrieve chore data for this account
      const data = dataStore[email];

      if (!data) {
        return res.status(200).json({
          success: true,
          data: {
            users: [],
            history: {},
            children: [],
          },
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
