"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Email Notification Details ─────────────────────
    await queryInterface.createTable("email_notification_details", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
      },
      notificationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "notifications", key: "id" },
        onDelete: "CASCADE",
      },
      to: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
      },
      cc: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: null,
      },
      bcc: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: null,
      },
      replyTo: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

  },

  async down(queryInterface) {
    await queryInterface.dropTable("push_notification_details");
  },
};