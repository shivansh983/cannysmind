const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../../../database/models');
const redis = require('../../../lib/redis'); 

async function loginClient(userName, rawPassword) {
  const user = await db.User.findOne({ where: { userName } });

  if (!user || !(await bcrypt.compare(rawPassword, user.password))) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const rawSessionToken = crypto.randomBytes(8).toString('hex');
  const hashedSessionToken = crypto.createHash('sha256').update(rawSessionToken).digest('hex');

 // await redis.set(`app:${user.id}:${hashedSessionToken}`, 'active', 'EX', 86400);
  const reply = await redis.set(`app:${user.id}:${hashedSessionToken}`, user.id, 'EX', 86400);
  console.log(` REDIS SAVE STATUS: ${reply}`);
  console.log(` KEY NAME SAVED: app:${user.id}:${hashedSessionToken}`);
  return { clientId: user.id, token: rawSessionToken };
}

module.exports = loginClient;