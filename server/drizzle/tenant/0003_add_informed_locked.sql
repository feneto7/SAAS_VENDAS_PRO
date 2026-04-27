ALTER TABLE "fichas" ADD COLUMN "items_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ficha_items" ADD COLUMN "informed" boolean DEFAULT false NOT NULL;
