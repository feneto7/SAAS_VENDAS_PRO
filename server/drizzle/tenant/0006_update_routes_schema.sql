ALTER TABLE "routes" ADD COLUMN "code" integer NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "routes_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "periodicity" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "active" boolean DEFAULT true NOT NULL;