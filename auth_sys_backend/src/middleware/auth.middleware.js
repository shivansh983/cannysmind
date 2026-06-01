'use strict';

const crypto = require('crypto');
const redis = require('../utils/redis');
const db = require('../database/models');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const clientId = req.headers['client-id'];

    if (!authHeader || !authHeader.startsWith('Bearer ') || !clientId) {
      return res.status(401).json({ message: 'Unauthorized: Missing token or Client ID' });
    }

    const rawToken = authHeader.split(' ')[1];
    
    const tokenParts = rawToken.split('.');
    const secretOnly = tokenParts.length === 2 ? tokenParts[1] : rawToken;

    const hashedToken = crypto.createHash('sha256').update(secretOnly).digest('hex');
    const redisKey = `app:${clientId}:${hashedToken}`;

    const sessionActive = await redis.get(redisKey);
    if (!sessionActive) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    const user = await db.User.findByPk(clientId, {
      attributes: ['id', 'name', 'userName', 'role'],
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      userName: user.userName,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { protect };