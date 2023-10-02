CREATE TABLE IF NOT EXISTS "open_board_user_password_reset_token" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "expires_on" TIMESTAMP NOT NULL
);

ALTER TABLE "open_board_user_password_reset_token" ADD FOREIGN KEY ("user_id") REFERENCES "open_board_user" ("id");