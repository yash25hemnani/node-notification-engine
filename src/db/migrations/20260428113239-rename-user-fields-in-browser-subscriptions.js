// migrations/xxxx-rename-user-fields-in-browser-subscriptions.ts

module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn(
      "browser_subscriptions",
      "user_id",
      "customer_id",
    );

    await queryInterface.renameColumn(
      "browser_subscriptions",
      "user_email",
      "customer_email",
    );
  },

  async down(queryInterface) {
    await queryInterface.renameColumn(
      "browser_subscriptions",
      "customer_id",
      "user_id",
    );

    await queryInterface.renameColumn(
      "browser_subscriptions",
      "customer_email",
      "user_email",
    );
  },
};
