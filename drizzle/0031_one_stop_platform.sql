-- Phase 1: One-Stop Platform — conversations, messages, invoices, audit_logs, commission tracking

-- Conversations (Airbnb-style message threads)
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" serial PRIMARY KEY NOT NULL,
    "booking_id" integer REFERENCES "bookings"("id") ON DELETE SET NULL,
    "participant1_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "participant2_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "last_message_at" timestamp DEFAULT now() NOT NULL,
    "last_message_preview" varchar(200),
    "participant1_read" boolean DEFAULT true,
    "participant2_read" boolean DEFAULT true,
    "closed" boolean DEFAULT false,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "conversations_booking_idx" ON "conversations" USING btree ("booking_id");
CREATE INDEX IF NOT EXISTS "conversations_p1_idx" ON "conversations" USING btree ("participant1_id");
CREATE INDEX IF NOT EXISTS "conversations_p2_idx" ON "conversations" USING btree ("participant2_id");
CREATE INDEX IF NOT EXISTS "conversations_last_msg_idx" ON "conversations" USING btree ("last_message_at");

-- Messages
CREATE TABLE IF NOT EXISTS "messages" (
    "id" serial PRIMARY KEY NOT NULL,
    "conversation_id" integer NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
    "sender_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "body" text NOT NULL,
    "read_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "messages_conversation_idx" ON "messages" USING btree ("conversation_id");
CREATE INDEX IF NOT EXISTS "messages_sender_idx" ON "messages" USING btree ("sender_id");
CREATE INDEX IF NOT EXISTS "messages_created_idx" ON "messages" USING btree ("created_at");

-- Invoices
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" serial PRIMARY KEY NOT NULL,
    "invoice_number" varchar(50) UNIQUE NOT NULL,
    "booking_id" integer NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
    "issuer_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "recipient_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "subtotal" numeric(10,2) NOT NULL,
    "commission_amount" numeric(10,2) NOT NULL,
    "commission_rate" numeric(5,4) NOT NULL,
    "total" numeric(10,2) NOT NULL,
    "status" varchar(50) DEFAULT 'issued',
    "line_items" jsonb DEFAULT '[]',
    "issued_at" timestamp DEFAULT now() NOT NULL,
    "paid_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "invoices_booking_idx" ON "invoices" USING btree ("booking_id");
CREATE INDEX IF NOT EXISTS "invoices_issuer_idx" ON "invoices" USING btree ("issuer_id");
CREATE INDEX IF NOT EXISTS "invoices_recipient_idx" ON "invoices" USING btree ("recipient_id");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" USING btree ("status");

-- Audit logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" serial PRIMARY KEY NOT NULL,
    "actor_id" text REFERENCES "user"("id") ON DELETE SET NULL,
    "action" varchar(100) NOT NULL,
    "entity_type" varchar(50) NOT NULL,
    "entity_id" varchar(50),
    "meta" jsonb,
    "ip" varchar(45),
    "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");

-- Commission tracking columns on payouts
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "commission_rate" numeric(5,4) DEFAULT '0.08';
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "commission_amount" integer DEFAULT 0;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "net_amount" integer;
