'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add 'role' to Users (We keep this from the original file)
    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'user',
    });

    // 2. Add the Top-Down Jira Columns to Tasks
    await queryInterface.addColumn('Tasks', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'open',
      allowNull: false,
    });

    await queryInterface.addColumn('Tasks', 'managerId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Tasks', 'assigneeId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 3. Create the Comments Table
    await queryInterface.createTable('Comments', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      taskId: { 
        type: Sequelize.STRING(6), allowNull: false, 
        references: { model: 'Tasks', key: 'id' }, onDelete: 'CASCADE' 
      },
      authorId: { 
        type: Sequelize.UUID, allowNull: false, 
        references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' 
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 4. Create the TaskLogs (Activity History) Table
    await queryInterface.createTable('TaskLogs', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      taskId: { 
        type: Sequelize.STRING(6), allowNull: false, 
        references: { model: 'Tasks', key: 'id' }, onDelete: 'CASCADE' 
      },
      actorId: { 
        type: Sequelize.UUID, allowNull: false, 
        references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' 
      },
      action: { type: Sequelize.STRING, allowNull: false }, // e.g., 'STATUS_CHANGED'
      fromStatus: { type: Sequelize.STRING, allowNull: true },
      toStatus: { type: Sequelize.STRING, allowNull: true },
      note: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  async down(queryInterface, Sequelize) {
    // If you ever undo this migration, it deletes everything in reverse order
    await queryInterface.dropTable('TaskLogs');
    await queryInterface.dropTable('Comments');
    
    await queryInterface.removeColumn('Tasks', 'assigneeId');
    await queryInterface.removeColumn('Tasks', 'managerId');
    await queryInterface.removeColumn('Tasks', 'status');
    
    await queryInterface.removeColumn('Users', 'role');
  },
};