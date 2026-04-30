// migrations/xxxx-rename-user-fields-in-notifications.ts

module.exports = {
  async up(queryInterface) {
    // Rename user_id -> customer_id
    await queryInterface.renameColumn(
      "notifications",
      "user_id",
      "customer_id",
    );

    // Rename user_email -> customer_email
    await queryInterface.renameColumn(
      "notifications",
      "user_email",
      "customer_email",
    );
  },

  async down(queryInterface) {
    // Rollback customer_id -> user_id
    await queryInterface.renameColumn(
      "notifications",
      "customer_id",
      "user_id",
    );

    // Rollback customer_email -> user_email
    await queryInterface.renameColumn(
      "notifications",
      "customer_email",
      "user_email",
    );
  },
};