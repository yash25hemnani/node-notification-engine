import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize.js";

export class BrowserSubscription extends Model {
  declare id: string;
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
