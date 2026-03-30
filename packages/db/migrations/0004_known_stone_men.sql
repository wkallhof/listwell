ALTER TYPE "public"."credit_transaction_type" ADD VALUE 'MANUAL_GRANT';--> statement-breakpoint
ALTER TYPE "public"."credit_transaction_type" ADD VALUE 'MANUAL_DEDUCT';--> statement-breakpoint
CREATE TABLE "user_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"description" text,
	"resource_type" text,
	"resource_id" text,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN "admin_user_id" text;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "agent_cost_usd" real;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "agent_input_tokens" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "agent_output_tokens" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "agent_provider" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspended_reason" text;--> statement-breakpoint
ALTER TABLE "user_activity_log" ADD CONSTRAINT "user_activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_userId_createdAt_idx" ON "user_activity_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_log_eventType_createdAt_idx" ON "user_activity_log" USING btree ("event_type","created_at");