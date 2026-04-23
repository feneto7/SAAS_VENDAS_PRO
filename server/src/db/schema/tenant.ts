import { pgTable, text, timestamp, uuid, pgEnum, integer, uniqueIndex, boolean, check } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "seller"]);
export const fichaStatusEnum = pgEnum("ficha_status", ["nova", "pendente", "paga", "link_gerado", "pedido"]);
export const movementTypeEnum = pgEnum("movement_type", ["entrada_estoque", "ajuste_manual"]);
export const cobrancaStatusEnum = pgEnum("cobranca_status", ["aberta", "encerrada"]);

// ─── Users (Vendedores/Gerentes) ──────────────────────────────────────────────

export const users = pgTable("users", {
  id:        uuid("id").defaultRandom().primaryKey(),
  code:      integer("code").generatedAlwaysAsIdentity(),
  name:      text("name").notNull(),
  email:     text("email").notNull().unique(), // Required for all users now
  role:      userRoleEnum("role").default("seller").notNull(),
  appCode:   text("app_code"),          // Login code for mobile app
  passwordHash: text("password_hash"),  // Hashed password
  webAccess: boolean("web_access").default(false).notNull(), // Web login allowed?
  phone:     text("phone"),
  active:    boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  appCodeIdx: uniqueIndex("app_code_idx").on(table.appCode),
}));

// ─── Products (Produtos) ──────────────────────────────────────────────────────

export const products = pgTable("products", {
  id:          uuid("id").defaultRandom().primaryKey(),
  sku:         text("sku"),
  name:        text("name").notNull(), // Descrição
  description: text("description"),
  category:    text("category"),
  brand:       text("brand"),
  stockDeposit: integer("stock_deposit").default(0).notNull(),
  costPrice:    integer("cost_price").default(0).notNull(),
  priceCC:      integer("price_cc").default(0).notNull(),
  priceSC:      integer("price_sc").default(0).notNull(),
  price:       integer("price").default(0), // Deprecated
  active:      boolean("active").default(true).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  stockDepositCheck: check("stock_deposit_check", sql`${table.stockDeposit} >= 0`),
}));

// ─── Routes (Rotas de Venda) ──────────────────────────────────────────────────

export const routes = pgTable("routes", {
  id:          uuid("id").defaultRandom().primaryKey(),
  code:        integer("code").generatedAlwaysAsIdentity(),
  name:        text("name").notNull(),
  description: text("description"),
  periodicity: integer("periodicity").default(30).notNull(),
  active:      boolean("active").default(true).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ─── Cobranças (Viagens do Vendedor) ──────────────────────────────────────────

export const cobrancas = pgTable("cobrancas", {
  id:        uuid("id").defaultRandom().primaryKey(),
  code:      integer("code").generatedAlwaysAsIdentity(),
  routeId:   uuid("route_id").references(() => routes.id).notNull(),
  sellerId:  uuid("seller_id").references(() => users.id).notNull(),
  status:    cobrancaStatusEnum("status").default("aberta").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate:   timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Clients (Clientes) ───────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id:           uuid("id").defaultRandom().primaryKey(),
  code:         integer("code").generatedAlwaysAsIdentity(),
  name:         text("name").notNull(),
  cpf:          text("cpf"),
  phone:        text("phone"),
  street:       text("street"),
  number:       text("number"),
  neighborhood: text("neighborhood"),
  city:         text("city"),
  state:        text("state"),
  zipCode:      text("zip_code"),
  nickname:     text("nickname"),
  referencePoint: text("reference_point"),
  phone2:       text("phone2"),
  comment:      text("comment"),
  routeId:      uuid("route_id").references(() => routes.id),
  active:       boolean("active").default(true).notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

// ─── Fichas de Venda ──────────────────────────────────────────────────────────

export const fichas = pgTable("fichas", {
  id:        uuid("id").defaultRandom().primaryKey(),
  code:      text("code").unique(),
  status:    fichaStatusEnum("status").default("nova").notNull(),
  total:     integer("total").default(0).notNull(),
  notes:     text("notes"),
  saleDate:  timestamp("sale_date").defaultNow().notNull(),
  clientId:  uuid("client_id").references(() => clients.id).notNull(),
  sellerId:  uuid("seller_id").references(() => users.id).notNull(),
  routeId:   uuid("route_id").references(() => routes.id).notNull(),
  cobrancaId: uuid("cobranca_id").references(() => cobrancas.id),
  linkToken: text("link_token").unique(),
  discount:  integer("discount").default(0).notNull(),
  commissionPercent: integer("commission_percent").default(0).notNull(), // Percentual de comissão (ex: 30)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Ficha Items (Itens da Ficha) ─────────────────────────────────────────────

export const fichaItems = pgTable("ficha_items", {
  id:        uuid("id").defaultRandom().primaryKey(),
  fichaId:   uuid("ficha_id").references(() => fichas.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  quantity:  integer("quantity").default(1).notNull(), // Quantidade Deixada
  quantitySold: integer("quantity_sold").default(0).notNull(),
  quantityReturned: integer("quantity_returned").default(0).notNull(),
  unitPrice: integer("unit_price").default(0).notNull(),
  subtotal:  integer("subtotal").default(0).notNull(),
  commissionType: text("commission_type").default("CC"), // CC ou SC
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

export const paymentMethods = pgTable("payment_methods", {
  id:        uuid("id").defaultRandom().primaryKey(),
  name:      text("name").notNull(), // Dinheiro, Pix, Cartão, etc.
  active:    boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Payments (Pagamentos da Ficha) ──────────────────────────────────────────

export const payments = pgTable("payments", {
  id:          uuid("id").defaultRandom().primaryKey(),
  fichaId:     uuid("ficha_id").references(() => fichas.id).notNull(),
  methodId:    uuid("method_id").references(() => paymentMethods.id).notNull(),
  amount:      integer("amount").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  cancelled:   boolean("cancelled").default(false).notNull(),
  cancelledAt: timestamp("cancelled_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ─── Seller Inventory (Estoque por Vendedor) ──────────────────────────────────
 
export const sellerInventory = pgTable("seller_inventory", {
  id:        uuid("id").defaultRandom().primaryKey(),
  sellerId:  uuid("seller_id").references(() => users.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  stock:     integer("stock").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sellerProductIdx: uniqueIndex("seller_product_idx").on(table.sellerId, table.productId),
  stockCheck: check("stock_check", sql`${table.stock} >= 0`),
}));

// ─── User Routes (Vínculo Vendedor x Rotas) ───────────────────────────────────

export const userRoutes = pgTable("user_routes", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    uuid("user_id").references(() => users.id).notNull(),
  routeId:   uuid("route_id").references(() => routes.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userRouteIdx: uniqueIndex("user_route_idx").on(table.userId, table.routeId),
}));

// ─── Inventory Movements (Histórico de Movimentações) ──────────────────────────

export const inventoryMovements = pgTable("inventory_movements", {
  id:          uuid("id").defaultRandom().primaryKey(),
  type:        movementTypeEnum("type").notNull(),
  description: text("description"),
  sellerId:    uuid("seller_id").references(() => users.id), // Null if general deposit
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const inventoryMovementItems = pgTable("inventory_movement_items", {
  id:             uuid("id").defaultRandom().primaryKey(),
  movementId:     uuid("movement_id").references(() => inventoryMovements.id).notNull(),
  productId:      uuid("product_id").references(() => products.id).notNull(),
  quantityBefore: integer("quantity_before").notNull(),
  quantityAfter:  integer("quantity_after").notNull(),
  quantityChange: integer("quantity_change").notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const userToRoutesRelations = relations(userRoutes, ({ one }) => ({
  user:  one(users,  { fields: [userRoutes.userId],  references: [users.id] }),
  route: one(routes, { fields: [userRoutes.routeId], references: [routes.id] }),
}));

export const routesRelations = relations(routes, ({ many }) => ({
  clients:   many(clients),
  fichas:    many(fichas),
  sellers:   many(userRoutes),
  cobrancas: many(cobrancas),
}));

export const cobrancasRelations = relations(cobrancas, ({ one, many }) => ({
  route:   one(routes, { fields: [cobrancas.routeId], references: [routes.id] }),
  seller:  one(users,  { fields: [cobrancas.sellerId], references: [users.id]  }),
  fichas:  many(fichas),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  route:  one(routes, { fields: [clients.routeId], references: [routes.id] }),
  fichas: many(fichas),
}));

export const usersRelations = relations(users, ({ many }) => ({
  fichas:    many(fichas),
  routes:    many(userRoutes),
  inventory: many(sellerInventory),
}));

export const productsRelations = relations(products, ({ many }) => ({
  fichaItems:      many(fichaItems),
  sellerInventory: many(sellerInventory),
}));

export const fichasRelations = relations(fichas, ({ one, many }) => ({
  client:    one(clients,  { fields: [fichas.clientId],  references: [clients.id]  }),
  seller:    one(users,    { fields: [fichas.sellerId],  references: [users.id]    }),
  route:     one(routes,   { fields: [fichas.routeId],   references: [routes.id]   }),
  cobranca:  one(cobrancas, { fields: [fichas.cobrancaId], references: [cobrancas.id] }),
  items:     many(fichaItems),
  payments:  many(payments),
}));

export const fichaItemsRelations = relations(fichaItems, ({ one }) => ({
  ficha:   one(fichas,   { fields: [fichaItems.fichaId],   references: [fichas.id]   }),
  product: one(products, { fields: [fichaItems.productId], references: [products.id] }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  ficha: one(fichas, {
    fields: [payments.fichaId],
    references: [fichas.id],
  }),
  method: one(paymentMethods, {
    fields: [payments.methodId],
    references: [paymentMethods.id],
  }),
}));

export const sellerInventoryRelations = relations(sellerInventory, ({ one }) => ({
  seller:  one(users,    { fields: [sellerInventory.sellerId],  references: [users.id]    }),
  product: one(products, { fields: [sellerInventory.productId], references: [products.id] }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one, many }) => ({
  seller: one(users, { fields: [inventoryMovements.sellerId], references: [users.id] }),
  items:  many(inventoryMovementItems),
}));

export const inventoryMovementItemsRelations = relations(inventoryMovementItems, ({ one }) => ({
  movement: one(inventoryMovements, { fields: [inventoryMovementItems.movementId], references: [inventoryMovements.id] }),
  product:  one(products,           { fields: [inventoryMovementItems.productId],  references: [products.id]           }),
}));
