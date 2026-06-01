'use strict';
const bcrypt = require('bcrypt');
const crypto = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const now = new Date();

    await queryInterface.bulkInsert('Users', [
      {
        id: crypto.randomUUID(),
        name: 'Admin',
        userName: 'admin',
        email: 'admin@gmail.com',
        password: passwordHash,
        role: 'admin',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'Manager',
        userName: 'manager',
        email: 'manager@gmail.com',
        password: passwordHash,
        role: 'manager',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'User',
        userName: 'user1',
        email: 'user1@gmail.com',
        password: passwordHash,
        role: 'user',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'User2',
        userName: 'user2',
        email: 'user2@teamhub.com',
        password: passwordHash,
        role: 'user',
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};