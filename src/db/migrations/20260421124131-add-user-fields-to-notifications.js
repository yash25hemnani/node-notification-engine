'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('notifications', 'user_id', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn('notifications', 'user_email', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Optional but recommended index for performance
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['user_email']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('notifications', 'user_id');
    await queryInterface.removeColumn('notifications', 'user_email');
  },
};