// models/ApiKey.ts
import { DataTypes, Model, Optional, NonAttribute } from "sequelize";
import { sequelize } from "../sequelize";
import { User } from "./User";

interface ApiKeyAttributes {
  id: string;
  name: string;
  user_id: string; // 👈 ADD
  key_hash: string;
  scopes: string[];
  is_active: boolean;
}

interface ApiKeyCreationAttributes
  extends Optional<ApiKeyAttributes, "id" | "is_active"> {}

export class ApiKey
  extends Model<ApiKeyAttributes, ApiKeyCreationAttributes>
  implements ApiKeyAttributes
{
  declare id: string;
  declare name: string;
  declare user_id: string; 
  declare key_hash: string;
  declare scopes: string[];
  declare is_active: boolean;

  // association 
  declare user?: NonAttribute<User>;
}

ApiKey.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    key_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    scopes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "api_keys",
    timestamps: true,
  }
);