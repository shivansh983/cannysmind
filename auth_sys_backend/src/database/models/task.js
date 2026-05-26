'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: 'userId', as: 'owner' });
      Task.belongsTo(models.User, { foreignKey: 'approverId', as: 'approver' });

      Task.belongsToMany(models.User, {
        through: 'TaskMembers',
        as: 'joinedUsers',
        foreignKey: 'taskId',
        otherKey: 'userId',
      });
    }
  }

  Task.init({
    id: {
      type: DataTypes.STRING(6),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    approvalStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'approved',
      validate: {
        isIn: {
          args: [['pending', 'approved', 'rejected']],
          msg: 'approvalStatus must be pending, approved, or rejected',
        },
      },
    },

    maxUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },

    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    completedAt: DataTypes.DATE,
    duration: {
      type: DataTypes.VIRTUAL,
      get() {
        const started = this.getDataValue('startedAt');
        const completed = this.getDataValue('completedAt');
        if (started && completed) {
          const diffInMs = completed.getTime() - started.getTime();
          return `${Math.floor(diffInMs / 60000)} minutes`;
        }
        return 'Pending';
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    approverId: DataTypes.UUID,

  }, {
    sequelize,
    modelName: 'Task',
    tableName: 'Tasks',
    hooks: {
      beforeValidate: (task) => {
        if (!task.id) {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let result = '';
          for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          task.id = result;
        }
      },
    },
  });

  return Task;
};