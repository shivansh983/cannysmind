const bcrypt = require('bcrypt');
const db = require('../../../database/models'); 

async function registerClient(name, userName, email, phone, password) {
  const existingUser = await db.User.findOne({ where: { userName } });
  if (existingUser) throw new Error('USERNAME_TAKEN');

 
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await db.User.create({
    name,
    userName,
    email,
    phone,
    password: hashedPassword
  });

  return newUser;
}
    
module.exports = registerClient;