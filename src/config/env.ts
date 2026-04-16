import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default("5000")
    .transform((val) => parseInt(val, 10)),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),

  JWT_ACCESS_EXPIRES_IN: z.string().min(1, "JWT_ACCESS_EXPIRES_IN is required"),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1, "JWT_REFRESH_EXPIRES_IN is required"),

  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),

  // Email Configuration
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z
    .string()
    .default("587")
    .transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM_EMAIL: z.string().email().default("noreply@schoolos.com"),
  SMTP_FROM_NAME: z.string().default("SchoolOS"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:");
  console.error(parsedEnv.error.format());
  process.exit(1);
}

const env = {
  port: parsedEnv.data.PORT,
  nodeEnv: parsedEnv.data.NODE_ENV,
  mongoUri: parsedEnv.data.MONGO_URI,
  jwtAccessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: parsedEnv.data.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: parsedEnv.data.JWT_REFRESH_EXPIRES_IN,
  clientUrl: parsedEnv.data.CLIENT_URL,
  smtp: {
    host: parsedEnv.data.SMTP_HOST,
    port: parsedEnv.data.SMTP_PORT,
    user: parsedEnv.data.SMTP_USER,
    pass: parsedEnv.data.SMTP_PASS,
    fromEmail: parsedEnv.data.SMTP_FROM_EMAIL,
    fromName: parsedEnv.data.SMTP_FROM_NAME,
  },
};

export default env;
