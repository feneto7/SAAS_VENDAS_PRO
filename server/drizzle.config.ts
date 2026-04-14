import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/master.ts",
  out: "./drizzle/master",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
