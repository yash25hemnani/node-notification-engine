import { DataTypes, Model, NonAttribute, Optional } from "sequelize";
import { sequelize } from "../sequelize";
import { User } from "./User";

interface TemplateAttributes {
  id: string;
  name: string;
  slug: string;
  channel: "email" | "push";
  userId: string;
  subject: string | null;
  body: string;
}

interface TemplateCreationAttributes
  extends Optional<TemplateAttributes, "id" | "subject" | "body"> {}

export class Template extends Model<
  TemplateAttributes,
  TemplateCreationAttributes
> {
  declare id: string;
  declare slug: string;
  declare name: string;
  declare channel: "email" | "push";
  declare subject: string | null;
  declare body: string;

    // association
    declare user?: NonAttribute<User>;
}

Template.init(
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
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM("email", "push"),
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
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "templates",
  }
);