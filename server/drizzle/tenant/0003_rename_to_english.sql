-- Rename enums from Portuguese to English
ALTER TYPE "ficha_status" RENAME TO "card_status";--> statement-breakpoint
ALTER TYPE "cobranca_status" RENAME TO "collection_status";--> statement-breakpoint

-- Rename tables from Portuguese to English
ALTER TABLE "fichas" RENAME TO "cards";--> statement-breakpoint
ALTER TABLE "ficha_items" RENAME TO "card_items";--> statement-breakpoint
ALTER TABLE "cobrancas" RENAME TO "collections";--> statement-breakpoint

-- Add new columns (items_locked on cards, informed on card_items)
ALTER TABLE "cards" ADD COLUMN "items_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "card_items" ADD COLUMN "informed" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- Drop all foreign key constraints (they reference old table names, will be re-added)
ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "fichas_client_id_clients_id_fk";--> statement-breakpoint
ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "fichas_seller_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "fichas_route_id_routes_id_fk";--> statement-breakpoint
ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "fichas_cobranca_id_cobrancas_id_fk";--> statement-breakpoint
ALTER TABLE "card_items" DROP CONSTRAINT IF EXISTS "ficha_items_ficha_id_fichas_id_fk";--> statement-breakpoint
ALTER TABLE "card_items" DROP CONSTRAINT IF EXISTS "ficha_items_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "collections" DROP CONSTRAINT IF EXISTS "cobrancas_route_id_routes_id_fk";--> statement-breakpoint
ALTER TABLE "collections" DROP CONSTRAINT IF EXISTS "cobrancas_seller_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_ficha_id_fichas_id_fk";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_method_id_payment_methods_id_fk";--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_route_id_routes_id_fk";--> statement-breakpoint
ALTER TABLE "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_seller_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "inventory_movement_items" DROP CONSTRAINT IF EXISTS "inventory_movement_items_movement_id_inventory_movements_id_fk";--> statement-breakpoint
ALTER TABLE "inventory_movement_items" DROP CONSTRAINT IF EXISTS "inventory_movement_items_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "seller_inventory" DROP CONSTRAINT IF EXISTS "seller_inventory_seller_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "seller_inventory" DROP CONSTRAINT IF EXISTS "seller_inventory_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "user_routes" DROP CONSTRAINT IF EXISTS "user_routes_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "user_routes" DROP CONSTRAINT IF EXISTS "user_routes_route_id_routes_id_fk";
