-- Up Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "open_board_user" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "external_provider_id" UUID,
  "thumbnail" UUID,
  "username" VARCHAR(255) UNIQUE NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "first_name" VARCHAR(255),
  "last_name" VARCHAR(255),
  "dark_mode" BOOLEAN NOT NULL DEFAULT FALSE,
  "hashed_password" TEXT,
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "date_updated" TIMESTAMP,
  "last_login" TIMESTAMP,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "reset_password_on_login" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "open_board_file_upload" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "date_updated" TIMESTAMP,
  "file_path" VARCHAR(255) NOT NULL,
  "file_size" INTEGER NOT NULL,
  "additional_details" JSONB
);

CREATE TABLE IF NOT EXISTS "open_board_role" (
  "id" uuid UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" varchar(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS "open_board_role_permission" (
  "id" uuid UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "path" varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS "open_board_role_permissions" (
  "role_id" UUID NOT NULL,
  "permission_id" UUID NOT NULL,
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE IF NOT EXISTS "open_board_user_roles" (
  "user_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE IF NOT EXISTS "open_board_external_provider_roles" (
  "provider_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  PRIMARY KEY ("provider_id", "role_id")
);

CREATE TABLE IF NOT EXISTS "open_board_user_session" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "date_updated" TIMESTAMP,
  "expires_on" TIMESTAMP NOT NULL,
  "remember_me" BOOLEAN NOT NULL DEFAULT FALSE,
  "access_token" TEXT UNIQUE NOT NULL,
  "refresh_token" TEXT,
  "ip_address" VARCHAR(255) NOT NULL,
  "user_agent" VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS "open_board_multi_auth_method" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "date_updated" TIMESTAMP,
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(255) NOT NULL,
  "credential_data" JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS "open_board_user_password_reset_token" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "expires_on" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "open_board_user_email_verification_token" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "expires_on" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "open_board_external_auth_provider" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "date_updated" TIMESTAMP,
  "client_id" VARCHAR(255) NOT NULL,
  "client_secret" TEXT,
  "use_pkce" BOOLEAN NOT NULL DEFAULT FALSE,
  "auth_url" VARCHAR(255) NOT NULL,
  "token_url" VARCHAR(255) NOT NULL,
  "userinfo_url" VARCHAR(255) NOT NULL,
  "logout_url" VARCHAR(255),
  "default_login_method" BOOLEAN NOT NULL DEFAULT FALSE,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "self_registration_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "required_email_domain" VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS "open_board_auth_settings" (
  "access_token_lifetime" integer NOT NULL,
  "refresh_token_lifetime" integer NOT NULL,
  "refresh_token_idle_lifetime" integer NOT NULL
);

ALTER TABLE "open_board_user" ADD FOREIGN KEY ("thumbnail") REFERENCES "open_board_file_upload" ("id");
ALTER TABLE "open_board_role_permissions" ADD FOREIGN KEY ("role_id") REFERENCES "open_board_role" ("id") ON DELETE CASCADE;
ALTER TABLE "open_board_role_permissions" ADD FOREIGN KEY ("permission_id") REFERENCES "open_board_role_permission" ("id") ON DELETE CASCADE;
ALTER TABLE "open_board_user_roles" ADD FOREIGN KEY ("role_id") REFERENCES "open_board_role" ("id") ON DELETE CASCADE;
ALTER TABLE "open_board_user_roles" ADD FOREIGN KEY ("user_id") REFERENCES "open_board_user" ("id") ON DELETE CASCADE;
ALTER TABLE "open_board_external_provider_roles" ADD FOREIGN KEY ("role_id") REFERENCES "open_board_role" ("id") ON DELETE CASCADE;
ALTER TABLE "open_board_external_provider_roles" ADD FOREIGN KEY ("provider_id") REFERENCES "open_board_external_auth_provider" ("id") ON DELETE CASCADE;
ALTER TABLE "open_board_user_session" ADD FOREIGN KEY ("user_id") REFERENCES "open_board_user" ("id") ON DELETE CASCADE;
ALTER TABLE "open_board_multi_auth_method" ADD FOREIGN KEY ("user_id") REFERENCES "open_board_user" ("id") ON DELETE CASCADE;
ALTER TABLE "open_board_user_password_reset_token" ADD FOREIGN KEY ("user_id") REFERENCES "open_board_user" ("id") ON DELETE CASCADE;
ALTER TABLE "open_board_user_email_verification_token" ADD FOREIGN KEY ("user_id") REFERENCES "open_board_user" ("id") ON DELETE CASCADE;
ALTER TABLE "open_board_user" ADD FOREIGN KEY ("external_provider_id") REFERENCES "open_board_external_auth_provider" ("id");

CREATE UNIQUE INDEX one_row_only_uidx ON "open_board_auth_settings" (( true ));

-- Down Migration
DROP TABLE "open_board_auth_settings" CASCADE;
DROP TABLE "open_board_external_auth_provider" CASCADE;
DROP TABLE "open_board_user_email_verification_token" CASCADE;
DROP TABLE "open_board_user_password_reset_token" CASCADE;
DROP TABLE "open_board_multi_auth_method" CASCADE;
DROP TABLE "open_board_user_session" CASCADE;
DROP TABLE "open_board_external_provider_roles" CASCADE;
DROP TABLE "open_board_user_roles" CASCADE;
DROP TABLE "open_board_role_permissions" CASCADE;
DROP TABLE "open_board_role_permission" CASCADE;
DROP TABLE "open_board_role" CASCADE;
DROP TABLE "open_board_file_upload" CASCADE;
DROP TABLE "open_board_user" CASCADE;