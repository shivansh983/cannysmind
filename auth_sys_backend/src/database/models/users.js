'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // The Task Hierarchy
      User.hasMany(models.Task, { foreignKey: 'userId', as: 'createdTasks' });
      User.hasMany(models.Task, { foreignKey: 'managerId', as: 'managedTasks' });
      User.hasMany(models.Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });

      // The Collaboration
      User.hasMany(models.Comment, { foreignKey: 'authorId', as: 'comments' });
      User.hasMany(models.TaskLog, { foreignKey: 'actorId', as: 'actions' });
    }
  }

  User.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, allowNull: false },
    userName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: false },
    roleId: { type: DataTypes.UUID, allowNull: true },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user',
      validate: { isIn: { args: [['admin', 'manager', 'user']] } }
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
  });

  return User;
};