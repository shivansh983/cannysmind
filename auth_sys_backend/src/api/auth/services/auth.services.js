const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const redis = require('../utils/redis');
const { Client } = require('../models'); 

const loginClient = async (userName, plainPassword) => {

  const client = await Client.findOne({ where: { userName } },({ where: { email } }))  ;
  if (!client) throw new Error('Client not found');
 



  if (!client) throw new Error(' not found');

  const isMatch = await bcrypt.compare(plainPassword, client.password);
  if (!isMatch) throw new Error('Invalid credentials');


  const token = jwt.sign(
    { id: client.id }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );


  await redis.set(`session:${token}`, client.id, 'EX', 86400);

  return { token, client: { id: client.id, userName: client.userName } };
};

module.exports = { loginClient };