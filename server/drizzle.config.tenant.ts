import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/tenant.ts",
  out: "./drizzle/tenant",
  dialect: "postgresql",
});
