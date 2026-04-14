import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

export const tenantStatusEnum = pgEnum("tenant_status", ["active", "suspended", "trial"]);

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // Will be used for DB name: companyname
  dbName: text("db_name").notNull().unique(), // Literal DB name in Postgres
  ownerClerkId: text("owner_clerk_id").notNull(),
  ownerName: text("owner_name"),
  ownerCpf: text("owner_cpf"),
  street: text("street"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  contact: text("contact"),
  status: tenantStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
