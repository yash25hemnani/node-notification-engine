"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("template_attachments", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      templateId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "templates",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      fileId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "uploaded_files",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mimeType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("template_attachments");
  },
};