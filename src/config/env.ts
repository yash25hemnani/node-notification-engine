import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env variable: ${key}`);
  }
  return value;
}

export const ENV = {
  PORT: Number(process.env.PORT || 4000),

  DB: {
    HOST: required("DB_HOST"),
    PORT: Number(required("DB_PORT")),
    NAME: required("DB_NAME"),
    USER: required("DB_USER"),
    PASS: required("DB_PASS"),
  },

  REDIS: {
    HOST: required("REDIS_HOST"),
    PORT: Number(required("REDIS_PORT")),
  },

  VAPID: {
    PUBLIC: process.env.VAPID_PUBLIC_KEY || "",
    PRIVATE: process.env.VAPID_PRIVATE_KEY || "",
  },

  SMTP: {
    HOST: required("SMTP_HOST"),
    PORT: required("SMTP_PORT"),
    USER: required("SMTP_USER"),
    PASS: required("SMTP_PASS"),

    FROM_NAME: process.env.SMTP_FROM_NAME || "Notifications",
    FROM_EMAIL: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
  },
} as const;
