CREATE TYPE "public"."movement_type" AS ENUM('entrada_estoque', 'ajuste_manual');--> statement-breakpoint
ALTER TYPE "public"."ficha_status" ADD VALUE 'link_gerado';--> statement-breakpoint
ALTER TYPE "public"."ficha_status" ADD VALUE 'pedido';--> statement-breakpoint
CREATE TABLE "inventory_movement_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movement_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity_before" integer NOT NULL,
	"quantity_after" integer NOT NULL,
	"quantity_change" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "movement_type" NOT NULL,
	"description" text,
	"seller_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "route_inventory" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "route_inventory" CASCADE;--> statement-breakpoint
ALTER TABLE "fichas" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "fichas" ADD COLUMN "link_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "code" integer NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "users_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "inventory_movement_items" ADD CONSTRAINT "inventory_movement_items_movement_id_inventory_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."inventory_movements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movement_items" ADD CONSTRAINT "inventory_movement_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_inventory" ADD CONSTRAINT "seller_inventory_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_inventory" ADD CONSTRAINT "seller_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "seller_product_idx" ON "seller_inventory" USING btree ("seller_id","product_id");--> statement-breakpoint
ALTER TABLE "fichas" ADD CONSTRAINT "fichas_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "fichas" ADD CONSTRAINT "fichas_link_token_unique" UNIQUE("link_token");