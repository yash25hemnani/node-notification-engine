import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface TemplateAttributes {
  id: string;
  name: string;
  slug: string;
  channel: "email" | "push";
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