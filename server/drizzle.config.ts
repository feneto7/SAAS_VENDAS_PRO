import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import { join } from "path";

// Garante o carregamento do .env da pasta server
dotenv.config({ path: join(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env");
}

export default defineConfig({
  schema: "./src/db/schema/master.ts",
  out: "./drizzle/master",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
