CREATE TABLE IF NOT EXISTS "students" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "person_id" uuid NOT NULL,
  "student_id" varchar(50) NOT NULL UNIQUE,
  "branch_id" uuid NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'PROSPECT',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_by" uuid,
  "updated_by" uuid
);
