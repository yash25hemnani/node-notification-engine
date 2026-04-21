import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize";

export class BrowserSubscription extends Model {
  declare id: string;
  declare user_id: string;
  declare user_email: string;
  declare endpoint: string;
  declare keys: object;
}

BrowserSubscription.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    keys: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "browser_subscriptions",
  },
);
