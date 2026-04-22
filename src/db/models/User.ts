// models/User.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";
import { RefreshToken } from "./RefreshToken";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

interface UserAttributes {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "role"> {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare email: string;
  declare password_hash: string;
  declare role: UserRole;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "user"),
      allowNull: false,
      defaultValue: "user",
    },
  },
  {
    sequelize,
    tableName: "users",
  }
);
