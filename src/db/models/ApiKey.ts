import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface ApiKeyAttributes {
  id: string;
  name: string;
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
  public id!: string;
  public name!: string;
  public key_hash!: string;
  public scopes!: string[];
  public is_active!: boolean;
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