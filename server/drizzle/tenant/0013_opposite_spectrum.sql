CREATE TYPE "public"."cobranca_status" AS ENUM('aberta', 'encerrada');--> statement-breakpoint
CREATE TABLE "cobrancas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" integer GENERATED ALWAYS AS IDENTITY (sequence name "cobrancas_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"route_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"status" "cobranca_status" DEFAULT 'aberta' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fichas" ADD COLUMN "cobranca_id" uuid;--> statement-breakpoint
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fichas" ADD CONSTRAINT "fichas_cobranca_id_cobrancas_id_fk" FOREIGN KEY ("cobranca_id") REFERENCES "public"."cobrancas"("id") ON DELETE no action ON UPDATE no action;