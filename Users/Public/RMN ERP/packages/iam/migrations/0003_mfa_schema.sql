ALTER TABLE "users" ADD COLUMN "totp_secret" varchar(255);
ALTER TABLE "users" ADD COLUMN "is_mfa_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "sessions" ADD COLUMN "mfa_verified" boolean DEFAULT false NOT NULL;

CREATE TABLE "step_up_challenges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "session_id" varchar(255) NOT NULL REFERENCES "sessions"("id"),
  "action" varchar(255) NOT NULL,
  "verified" boolean DEFAULT false NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
