import type { Config } from "drizzle-kit";
import path from "path";

export default {
  dialect: "postgresql",
  out: path.join(__dirname, "..", "drizzle"),
  schema: "./db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
