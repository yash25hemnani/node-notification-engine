import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize";

export class BrowserSubscription extends Model {
  declare id: string;
  declare customer_id: string;
  declare customer_email: string;
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
    customer_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_email: {
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