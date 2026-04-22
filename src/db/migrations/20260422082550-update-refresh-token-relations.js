'use strict';

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Add foreign key
    await queryInterface.changeColumn("refresh_tokens", "user_id", {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    });

    // Add unique constraint
    await queryInterface.addConstraint("refresh_tokens", {
      fields: ["token_hash"],
      type: "unique",
      name: "unique_refresh_token_hash",
    });

    // Add indexes
    await queryInterface.addIndex("refresh_tokens", ["user_id"]);
    await queryInterface.addIndex("refresh_tokens", ["token_hash"]);
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      "refresh_tokens",
      "unique_refresh_token_hash"
    );

    await queryInterface.removeIndex("refresh_tokens", ["user_id"]);
    await queryInterface.removeIndex("refresh_tokens", ["token_hash"]);

    // Remove FK (revert)
    await queryInterface.changeColumn("refresh_tokens", "user_id", {
      type: DataTypes.UUID,
      allowNull: false,
    });
  },
};