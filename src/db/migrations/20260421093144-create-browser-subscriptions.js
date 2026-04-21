module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("browser_subscriptions", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      endpoint: Sequelize.TEXT,
      keys: Sequelize.JSONB,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("browser_subscriptions");
  },
};