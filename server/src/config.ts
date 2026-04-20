import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const DEFAULT_CLIENT_ORIGIN = "http://localhost:8080";
const DEFAULT_PORT = 3000;

function parsePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function parseAllowedOrigins(value: string | undefined): string[] {
  const origins = (value ?? DEFAULT_CLIENT_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : [DEFAULT_CLIENT_ORIGIN];
}

export const port = parsePort(process.env.PORT);
export const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

export const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};
