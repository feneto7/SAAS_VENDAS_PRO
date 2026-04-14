import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import { join } from "path";

// Garante o carregamento do .env da pasta server
dotenv.config({ path: join(process.cwd(), ".env") });

console.log("DEBUG: DATABASE_URL is", process.env.DATABASE_URL ? "Defined" : "UNDEFINED");

export default defineConfig({
  schema: "./src/db/schema/master.ts",
  out: "./drizzle/master",
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "2011ThaylaLunaMel2013",
    database: "vendas_master",
    ssl: false,
  },
});
