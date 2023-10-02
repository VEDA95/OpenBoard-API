CREATE TABLE IF NOT EXISTS "open_board_multi_auth_method" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "date_updated" TIMESTAMP,
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(255) NOT NULL,
  "credential_data" JSONB NOT NULL
);

ALTER TABLE "open_board_multi_auth_method" ADD FOREIGN KEY ("user_id") REFERENCES "open_board_user" ("id");