// migrations/xxxx-rename-user-fields-in-notifications.ts

module.exports = {
  async up(queryInterface) {
    // Rename user_id -> customer_id
    await queryInterface.renameColumn(
      "notifications",
      "userId",
      "customerId",
    );

    // Rename user_email -> customer_email
    await queryInterface.renameColumn(
      "notifications",
      "userEmail",
      "customerEmail",
    );
  },

  async down(queryInterface) {
    // Rollback customer_id -> user_id
    await queryInterface.renameColumn(
      "notifications",
      "customerId",
      "userId",
    );

    // Rollback customer_email -> user_email
    await queryInterface.renameColumn(
      "notifications",
      "customerEmail",
      "userEmail",
    );
  },
};