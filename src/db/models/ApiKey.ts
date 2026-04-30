// models/ApiKey.ts
import { DataTypes, Model, Optional, NonAttribute } from "sequelize";
import { sequelize } from "../sequelize";
import { User } from "./User";

interface ApiKeyAttributes {
  id: string;
  name: string;
  userId: string;
  keyHash: string;
  scopes: string[];
  isActive: boolean;
  isRevealed: boolean;
}

interface ApiKeyCreationAttributes extends Optional<
  ApiKeyAttributes,
  "id" | "isActive" 
> {}

export class ApiKey
  extends Model<ApiKeyAttributes, ApiKeyCreationAttributes>
  implements ApiKeyAttributes
{
  declare id: string;
  declare name: string;
  declare userId: string;
  declare keyHash: string;
  declare scopes: string[];
  declare isActive: boolean;
  declare isRevealed: boolean;

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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    keyHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    scopes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isRevealed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "api_keys",
    timestamps: true,
  },
);
