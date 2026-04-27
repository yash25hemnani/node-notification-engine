"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("templates", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      channel: {
        type: Sequelize.ENUM("email", "push"),
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("templates");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_templates_channel";'
    );
  },
};