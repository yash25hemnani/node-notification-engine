// models/RefreshToken.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface RefreshTokenAttributes {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  is_revoked: boolean;
}

interface CreationAttributes extends Optional<RefreshTokenAttributes, "id" | "is_revoked"> {}

export class RefreshToken extends Model<RefreshTokenAttributes, CreationAttributes>
  implements RefreshTokenAttributes {
  declare id: string;
  declare user_id: string;
  declare token_hash: string;
  declare expires_at: Date;
  declare is_revoked: boolean;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { sequelize, tableName: "refresh_tokens" }
);