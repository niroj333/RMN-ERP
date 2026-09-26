CREATE TABLE IF NOT EXISTS "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parent_id" uuid REFERENCES "organizations"("id"),
  "type" varchar(50) NOT NULL,
  "name" varchar(255) NOT NULL,
  "path" text NOT NULL,
  "status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid
);
