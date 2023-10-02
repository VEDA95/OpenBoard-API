CREATE TABLE IF NOT EXISTS "open_board_auth_settings" (
  "access_token_lifetime" integer NOT NULL,
  "refresh_token_lifetime" integer NOT NULL,
  "refresh_token_idle_lifetime" integer NOT NULL
);