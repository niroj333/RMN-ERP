CREATE TABLE IF NOT EXISTS "reference_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar NOT NULL UNIQUE,
  "name" varchar NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid
);

CREATE TABLE IF NOT EXISTS "reference_values" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type_id" uuid NOT NULL,
  "code" varchar NOT NULL,
  "value" varchar NOT NULL,
  "display_order" integer NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "effective_from" date DEFAULT CURRENT_DATE NOT NULL,
  "effective_to" date,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid
);

ALTER TABLE "reference_values" ADD CONSTRAINT "reference_values_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "reference_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TABLE IF NOT EXISTS "numbering_policies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "entity_type" varchar NOT NULL,
  "branch_id" uuid,
  "prefix" varchar,
  "pattern" varchar NOT NULL,
  "sequence_scope" varchar NOT NULL,
  "is_gapless" boolean NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid
);

CREATE TABLE IF NOT EXISTS "numbering_sequences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "policy_id" uuid NOT NULL,
  "scope_key" varchar NOT NULL,
  "current_value" bigint DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid
);

ALTER TABLE "numbering_sequences" ADD CONSTRAINT "numbering_sequences_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "numbering_policies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TABLE IF NOT EXISTS "metadata_definitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "entity_type" varchar NOT NULL,
  "field_name" varchar NOT NULL,
  "data_type" varchar NOT NULL,
  "is_required" boolean NOT NULL,
  "is_active" boolean NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid
);
