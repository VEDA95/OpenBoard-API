CREATE TABLE IF NOT EXISTS "open_board_external_auth_provider" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
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
  "self_registration_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "required_email_domain" VARCHAR(255)
);

ALTER TABLE IF EXISTS "open_board_user" ADD FOREIGN KEY ("external_provider_id") REFERENCES "open_board_external_auth_provider" ("id");