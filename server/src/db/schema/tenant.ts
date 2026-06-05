import { pgTable, text, timestamp, uuid, pgEnum, integer, uniqueIndex, boolean, check, jsonb } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "seller"]);
export const cardStatusEnum = pgEnum("card_status", ["nova", "pendente", "paga", "link_gerado", "pedido"]);
export const movementTypeEnum = pgEnum("movement_type", ["entrada_estoque", "ajuste_manual"]);
export const collectionStatusEnum = pgEnum("collection_status", ["aberta", "encerrada"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id:        uuid("id").defaultRandom().primaryKey(),
  code:      integer("code").generatedAlwaysAsIdentity(),
  name:      text("name").notNull(),
  email:     text("email").notNull().unique(),
  role:      userRoleEnum("role").default("seller").notNull(),
  appCode:   text("app_code"),
  passwordHash: text("password_hash"),
  webAccess: boolean("web_access").default(false).notNull(),
  phone:     text("phone"),
  active:    boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  appCodeIdx: uniqueIndex("app_code_idx").on(table.appCode),
}));

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable("products", {
  id:          uuid("id").defaultRandom().primaryKey(),
  sku:         text("sku"),
  name:        text("name").notNull(),
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

// ─── Routes ───────────────────────────────────────────────────────────────────

export const routes = pgTable("routes", {
  id:          uuid("id").defaultRandom().primaryKey(),
  code:        integer("code").generatedAlwaysAsIdentity(),
  name:        text("name").notNull(),
  description: text("description"),
  periodicity: integer("periodicity").default(30).notNull(),
  active:      boolean("active").default(true).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ─── Collections (Seller collection trips) ────────────────────────────────────

export const collections = pgTable("collections", {
  id:        uuid("id").defaultRandom().primaryKey(),
  code:      integer("code").generatedAlwaysAsIdentity(),
  routeId:   uuid("route_id").references(() => routes.id).notNull(),
  sellerId:  uuid("seller_id").references(() => users.id).notNull(),
  status:    collectionStatusEnum("status").default("aberta").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate:   timestamp("end_date"),
  reportMetrics: jsonb("report_metrics"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Collection Inventory Snapshots ───────────────────────────────────────────

export const collectionInventorySnapshots = pgTable("collection_inventory_snapshots", {
  id:           uuid("id").defaultRandom().primaryKey(),
  collectionId: uuid("collection_id").references(() => collections.id).notNull(),
  sellerId:     uuid("seller_id").references(() => users.id).notNull(),
  productId:    uuid("product_id").references(() => products.id).notNull(),
  stockBefore:  integer("stock_before").notNull(),
  stockAfter:   integer("stock_after"),
  snapshotType: text("snapshot_type").notNull(), // "start" or "end"
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

// ─── Clients ──────────────────────────────────────────────────────────────────

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
  registeredInCollectionId: uuid("registered_in_collection_id").references(() => collections.id),
  active:       boolean("active").default(true).notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

// ─── Cards (Sales cards / Fichas) ─────────────────────────────────────────────

export const cards = pgTable("cards", {
  id:        uuid("id").defaultRandom().primaryKey(),
  code:      text("code").unique(),
  type:      integer("type").default(1).notNull(), // 1 = ficha, 2 = pedido
  status:    cardStatusEnum("status").default("nova").notNull(),
  statusUpdatedAt: timestamp("status_updated_at").defaultNow().notNull(),
  paidAt:    timestamp("paid_at"),
  total:     integer("total").default(0).notNull(),
  notes:     text("notes"),
  saleDate:  timestamp("sale_date").defaultNow().notNull(),
  clientId:  uuid("client_id").references(() => clients.id).notNull(),
  sellerId:  uuid("seller_id").references(() => users.id).notNull(),
  routeId:   uuid("route_id").references(() => routes.id).notNull(),
  collectionId: uuid("collection_id").references(() => collections.id),
  linkToken: text("link_token").unique(),
  discount:  integer("discount").default(0).notNull(),
  commissionPercent: integer("commission_percent").default(0).notNull(),
  itemsLocked: boolean("items_locked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Card Items ───────────────────────────────────────────────────────────────

export const cardItems = pgTable("card_items", {
  id:        uuid("id").defaultRandom().primaryKey(),
  cardId:    uuid("card_id").references(() => cards.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  quantity:  integer("quantity").default(1).notNull(),
  quantitySold: integer("quantity_sold").default(0).notNull(),
  quantityReturned: integer("quantity_returned").default(0).notNull(),
  informed:  boolean("informed").default(false).notNull(),
  unitPrice: integer("unit_price").default(0).notNull(),
  subtotal:  integer("subtotal").default(0).notNull(),
  commissionType: text("commission_type").default("CC"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

// ─── Payment Methods ──────────────────────────────────────────────────────────

export const paymentMethods = pgTable("payment_methods", {
  id:        uuid("id").defaultRandom().primaryKey(),
  name:      text("name").notNull(),
  active:    boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id:          uuid("id").defaultRandom().primaryKey(),
  cardId:      uuid("card_id").references(() => cards.id).notNull(),
  methodId:    uuid("method_id").references(() => paymentMethods.id).notNull(),
  collectionId: uuid("collection_id").references(() => collections.id),
  amount:      integer("amount").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  cancelled:   boolean("cancelled").default(false).notNull(),
  cancelledAt: timestamp("cancelled_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ─── Seller Inventory ─────────────────────────────────────────────────────────
 
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

// ─── User Routes ──────────────────────────────────────────────────────────────

export const userRoutes = pgTable("user_routes", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    uuid("user_id").references(() => users.id).notNull(),
  routeId:   uuid("route_id").references(() => routes.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userRouteIdx: uniqueIndex("user_route_idx").on(table.userId, table.routeId),
}));

// ─── Inventory Movements ──────────────────────────────────────────────────────

export const inventoryMovements = pgTable("inventory_movements", {
  id:           uuid("id").defaultRandom().primaryKey(),
  type:         movementTypeEnum("type").notNull(),
  description:  text("description"),
  collectionId: uuid("collection_id").references(() => collections.id),
  sellerId:     uuid("seller_id").references(() => users.id),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
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
  clients:     many(clients),
  cards:       many(cards),
  sellers:     many(userRoutes),
  collections: many(collections),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  route:     one(routes, { fields: [collections.routeId], references: [routes.id] }),
  seller:    one(users,  { fields: [collections.sellerId], references: [users.id] }),
  cards:     many(cards),
  payments:  many(payments),
  snapshots: many(collectionInventorySnapshots),
}));

export const collectionInventorySnapshotsRelations = relations(collectionInventorySnapshots, ({ one }) => ({
  collection: one(collections, { fields: [collectionInventorySnapshots.collectionId], references: [collections.id] }),
  seller:     one(users,       { fields: [collectionInventorySnapshots.sellerId],     references: [users.id] }),
  product:    one(products,    { fields: [collectionInventorySnapshots.productId],    references: [products.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  route:      one(routes, { fields: [clients.routeId], references: [routes.id] }),
  collection: one(collections, { fields: [clients.registeredInCollectionId], references: [collections.id] }),
  cards:      many(cards),
}));

export const usersRelations = relations(users, ({ many }) => ({
  cards:      many(cards),
  routes:     many(userRoutes),
  inventory:  many(sellerInventory),
}));

export const productsRelations = relations(products, ({ many }) => ({
  cardItems:       many(cardItems),
  sellerInventory: many(sellerInventory),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  client:     one(clients,     { fields: [cards.clientId],     references: [clients.id] }),
  seller:     one(users,       { fields: [cards.sellerId],     references: [users.id] }),
  route:      one(routes,      { fields: [cards.routeId],      references: [routes.id] }),
  collection: one(collections, { fields: [cards.collectionId], references: [collections.id] }),
  items:      many(cardItems),
  payments:   many(payments),
}));

export const cardItemsRelations = relations(cardItems, ({ one }) => ({
  card:    one(cards,    { fields: [cardItems.cardId],    references: [cards.id] }),
  product: one(products, { fields: [cardItems.productId], references: [products.id] }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  card: one(cards, {
    fields: [payments.cardId],
    references: [cards.id],
  }),
  method: one(paymentMethods, {
    fields: [payments.methodId],
    references: [paymentMethods.id],
  }),
  collection: one(collections, {
    fields: [payments.collectionId],
    references: [collections.id],
  }),
}));

export const sellerInventoryRelations = relations(sellerInventory, ({ one }) => ({
  seller:  one(users,    { fields: [sellerInventory.sellerId],  references: [users.id] }),
  product: one(products, { fields: [sellerInventory.productId], references: [products.id] }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one, many }) => ({
  collection: one(collections, { fields: [inventoryMovements.collectionId], references: [collections.id] }),
  seller:     one(users,       { fields: [inventoryMovements.sellerId],     references: [users.id] }),
  items:      many(inventoryMovementItems),
}));

export const inventoryMovementItemsRelations = relations(inventoryMovementItems, ({ one }) => ({
  movement: one(inventoryMovements, { fields: [inventoryMovementItems.movementId], references: [inventoryMovements.id] }),
  product:  one(products,           { fields: [inventoryMovementItems.productId],  references: [products.id] }),
}));
