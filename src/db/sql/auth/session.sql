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

ALTER TABLE IF EXISTS "open_board_user_session" ADD FOREIGN KEY ("user_id") REFERENCES "open_board_user" ("id");