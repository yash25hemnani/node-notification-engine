import { ApiKey } from "./ApiKey";
import { Notification } from "./Notification";
import { RefreshToken } from "./RefreshToken";
import { User } from "./User";

User.hasMany(RefreshToken, { foreignKey: "user_id", as: "tokens" });
RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(ApiKey, { foreignKey: "user_id", as: "apiKeys" });
ApiKey.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Notification, {
  foreignKey: "created_by",
  as: "createdNotifications",
});

Notification.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

export { ApiKey } from "./ApiKey";
export { Notification } from "./Notification";
export { Template } from "./Template";
export { BrowserSubscription } from "./BrowserSubscription";
export { User } from "./User";
export { RefreshToken } from "./RefreshToken";
