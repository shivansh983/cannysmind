'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Task, { foreignKey: 'userId', as: 'ownedTasks' });
      User.hasMany(models.Task, { foreignKey: 'approverId', as: 'approvedTasks' });

      User.belongsToMany(models.Task, {
        through: 'TaskMembers',
        as: 'joinedTasks',
        foreignKey: 'userId',
        otherKey: 'taskId',
      });
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: {
          args: [['admin', 'manager', 'user']],
          msg: 'Role must be admin, manager, or user',
        },
      },
    },

  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
  });

  return User;
};