'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'user',
    });

    await queryInterface.addColumn('Tasks', 'approvalStatus', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'approved',
    });

    await queryInterface.addColumn('Tasks', 'maxUsers', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 5,
    });

    await queryInterface.createTable('TaskMembers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      taskId: {
        type: Sequelize.STRING(6),
        allowNull: false,
        references: {
          model: 'Tasks',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TaskMembers');
    await queryInterface.removeColumn('Tasks', 'maxUsers');
    await queryInterface.removeColumn('Tasks', 'approvalStatus');
    await queryInterface.removeColumn('Users', 'role');
  },
};