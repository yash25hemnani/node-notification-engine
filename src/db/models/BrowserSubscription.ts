import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize";

export class BrowserSubscription extends Model {
  declare id: string;
  declare customerId: string;
  declare customerEmail: string;
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
    customerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerEmail: {
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