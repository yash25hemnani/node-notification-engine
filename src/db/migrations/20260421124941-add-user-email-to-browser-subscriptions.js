'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('browser_subscriptions', 'user_email', {
      type: Sequelize.STRING,
      allowNull: false, 
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('browser_subscriptions', 'user_email');
  },
};