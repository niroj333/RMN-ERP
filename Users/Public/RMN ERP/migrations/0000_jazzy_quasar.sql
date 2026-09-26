CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_name" varchar(100) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb,
	"performed_by" uuid,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"correlation_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumer_idempotency" (
	"consumer_name" varchar(255) NOT NULL,
	"event_id" uuid NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consumer_idempotency_consumer_name_event_id_pk" PRIMARY KEY("consumer_name","event_id")
);
--> statement-breakpoint
CREATE TABLE "dead_letter_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_event_id" uuid NOT NULL,
	"consumer_name" varchar(255) NOT NULL,
	"envelope" jsonb NOT NULL,
	"last_error" text,
	"failed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'UNRESOLVED' NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(255) NOT NULL,
	"aggregate_type" varchar(255) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"correlation_id" uuid NOT NULL,
	"causation_id" uuid,
	"producer" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_action" varchar(255) NOT NULL,
	"description" varchar(255),
	CONSTRAINT "permissions_resource_action_unique" UNIQUE("resource_action")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"user_agent" varchar(255),
	"ip_address" varchar(50),
	"expires_at" timestamp with time zone NOT NULL,
	"is_valid" boolean DEFAULT true NOT NULL,
	"mfa_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "step_up_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"action" varchar(255) NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"scope" varchar(50) DEFAULT 'GLOBAL' NOT NULL,
	"branch_id" uuid,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"totp_secret" varchar(255),
	"is_mfa_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "metadata_definitions" (
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
--> statement-breakpoint
CREATE TABLE "numbering_policies" (
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
--> statement-breakpoint
CREATE TABLE "numbering_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"scope_key" varchar NOT NULL,
	"current_value" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "reference_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "reference_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "reference_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type_id" uuid NOT NULL,
	"code" varchar NOT NULL,
	"value" varchar NOT NULL,
	"display_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" date DEFAULT now() NOT NULL,
	"effective_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"path" text NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "addresses" (
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
--> statement-breakpoint
CREATE TABLE "contact_methods" (
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
--> statement-breakpoint
CREATE TABLE "occupations" (
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
--> statement-breakpoint
CREATE TABLE "person_identifiers" (
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
--> statement-breakpoint
CREATE TABLE "person_relationships" (
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
--> statement-breakpoint
CREATE TABLE "persons" (
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
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"student_id" varchar(50) NOT NULL,
	"branch_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'PROSPECT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_up_challenges" ADD CONSTRAINT "step_up_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_up_challenges" ADD CONSTRAINT "step_up_challenges_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "numbering_sequences" ADD CONSTRAINT "numbering_sequences_policy_id_numbering_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."numbering_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_values" ADD CONSTRAINT "reference_values_type_id_reference_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."reference_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_id_organizations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_methods" ADD CONSTRAINT "contact_methods_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occupations" ADD CONSTRAINT "occupations_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_identifiers" ADD CONSTRAINT "person_identifiers_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_person_a_id_persons_id_fk" FOREIGN KEY ("person_a_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_person_b_id_persons_id_fk" FOREIGN KEY ("person_b_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_merged_into_id_persons_id_fk" FOREIGN KEY ("merged_into_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;