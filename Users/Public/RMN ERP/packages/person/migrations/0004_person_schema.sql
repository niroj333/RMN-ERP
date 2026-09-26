CREATE TABLE IF NOT EXISTS "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar,
	"first_name" varchar,
	"middle_name" varchar,
	"last_name" varchar,
	"date_of_birth" date,
	"gender" varchar,
	"status" varchar DEFAULT 'ACTIVE',
	"merged_into_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);

CREATE TABLE IF NOT EXISTS "contact_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"type" varchar NOT NULL,
	"value" varchar NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"effective_from" date DEFAULT now() NOT NULL,
	"effective_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);

CREATE TABLE IF NOT EXISTS "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"type" varchar NOT NULL,
	"line1" varchar,
	"line2" varchar,
	"city" varchar,
	"state" varchar,
	"country" varchar,
	"postal_code" varchar,
	"effective_from" date DEFAULT now() NOT NULL,
	"effective_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);

CREATE TABLE IF NOT EXISTS "person_identifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"type" varchar NOT NULL,
	"value" varchar NOT NULL,
	"issuing_country" varchar,
	"expires_at" date,
	"effective_from" date DEFAULT now() NOT NULL,
	"effective_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);

CREATE TABLE IF NOT EXISTS "person_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_a_id" uuid NOT NULL,
	"person_b_id" uuid NOT NULL,
	"relationship_type" varchar NOT NULL,
	"effective_from" date DEFAULT now() NOT NULL,
	"effective_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);

CREATE TABLE IF NOT EXISTS "occupations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"employer_name" varchar NOT NULL,
	"address_line1" varchar,
	"address_line2" varchar,
	"city" varchar,
	"state" varchar,
	"country" varchar,
	"postal_code" varchar,
	"start_date" date,
	"end_date" date,
	"effective_from" date DEFAULT now() NOT NULL,
	"effective_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);

DO $$ BEGIN
 ALTER TABLE "persons" ADD CONSTRAINT "persons_merged_into_id_persons_id_fk" FOREIGN KEY ("merged_into_id") REFERENCES "persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "contact_methods" ADD CONSTRAINT "contact_methods_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "addresses" ADD CONSTRAINT "addresses_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "person_identifiers" ADD CONSTRAINT "person_identifiers_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_person_a_id_persons_id_fk" FOREIGN KEY ("person_a_id") REFERENCES "persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_person_b_id_persons_id_fk" FOREIGN KEY ("person_b_id") REFERENCES "persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "occupations" ADD CONSTRAINT "occupations_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
