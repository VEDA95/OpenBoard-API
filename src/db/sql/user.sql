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
  "password_salt" VARCHAR(255),
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "date_updated" TIMESTAMP,
  "last_login" TIMESTAMP,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "reset_password_on_login" BOOLEAN NOT NULL DEFAULT FALSE
);