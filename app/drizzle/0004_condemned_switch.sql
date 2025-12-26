CREATE TYPE "public"."monitor_type" AS ENUM('http', 'ping', 'tcp');--> statement-breakpoint
CREATE TABLE "heartbeat" (
	"time" timestamp DEFAULT now() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"latency" integer NOT NULL,
	"status_code" integer,
	"status" text NOT NULL,
	"message" text,
	"region" text DEFAULT 'default'
);
--> statement-breakpoint
CREATE TABLE "monitor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "monitor_type" NOT NULL,
	"name" text NOT NULL,
	"target" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"frequency" integer DEFAULT 300 NOT NULL,
	"timeout" integer DEFAULT 20,
	"retries" smallint DEFAULT 0,
	"port" integer,
	"method" text DEFAULT 'GET',
	"expected_status" text DEFAULT '200-299',
	"headers" jsonb DEFAULT '[]'::jsonb,
	"keyword_found" text,
	"keyword_missing" text,
	"alert_on_down" boolean DEFAULT true,
	"alert_on_recovery" boolean DEFAULT true,
	"status" text DEFAULT 'pending',
	"next_check_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monitors_to_channels" (
	"monitor_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	CONSTRAINT "monitors_to_channels_monitor_id_channel_id_pk" PRIMARY KEY("monitor_id","channel_id")
);
--> statement-breakpoint
CREATE TABLE "notification_channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "heartbeat" ADD CONSTRAINT "heartbeat_monitor_id_monitor_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitor" ADD CONSTRAINT "monitor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitors_to_channels" ADD CONSTRAINT "monitors_to_channels_monitor_id_monitor_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitors_to_channels" ADD CONSTRAINT "monitors_to_channels_channel_id_notification_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."notification_channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_channel" ADD CONSTRAINT "notification_channel_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_heartbeat_monitor_time" ON "heartbeat" USING btree ("monitor_id","time");--> statement-breakpoint
CREATE INDEX "idx_monitor_user" ON "monitor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_monitor_next_check" ON "monitor" USING btree ("next_check_at");
