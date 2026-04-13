CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ficha_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ficha_items" ADD COLUMN "commission_type" text DEFAULT 'CC' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_ficha_id_fichas_id_fk" FOREIGN KEY ("ficha_id") REFERENCES "public"."fichas"("id") ON DELETE no action ON UPDATE no action;