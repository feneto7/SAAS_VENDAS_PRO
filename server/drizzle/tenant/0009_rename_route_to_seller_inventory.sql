ALTER TABLE "route_inventory" RENAME TO "seller_inventory";
ALTER TABLE "seller_inventory" RENAME COLUMN "route_id" TO "seller_id";

ALTER TABLE "seller_inventory" DROP CONSTRAINT "route_inventory_route_id_routes_id_fk";
ALTER TABLE "seller_inventory" ADD CONSTRAINT "seller_inventory_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

DROP INDEX "route_product_idx";
CREATE UNIQUE INDEX "seller_product_idx" ON "seller_inventory" USING btree ("seller_id","product_id");
