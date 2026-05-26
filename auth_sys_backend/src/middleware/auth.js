const crypto = require('crypto');
const redis = require('../lib/redis');

async function requireAuth(req, res, next) {
  try {
    const rawSessionToken = req.cookies.sessionId;
    
    if (!rawSessionToken) {
      return res.status(401).json({ error: 'Unauthorized: No session token provided' });
    }

    const hashedSessionToken = crypto
      .createHash('sha256')
      .update(rawSessionToken)
      .digest('hex');

    const [clientId, token] = rawSessionToken.split('.');
    
    if (!clientId || !token) {
        return res.status(401).json({ error: 'Unauthorized: Malformed token' });
    }

    const hashedTokenPart = crypto.createHash('sha256').update(token).digest('hex');
    const redisKey = `app:${clientId}:${hashedTokenPart}`;

    const sessionStatus = await redis.get(redisKey);

    if (!sessionStatus) {
      return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    }

    req.clientId = clientId;
    next();

  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

module.exports = requireAuth;