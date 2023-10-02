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

ALTER TABLE "open_board_role_permissions" ADD FOREIGN KEY ("role_id") REFERENCES "open_board_role" ("id");
ALTER TABLE "open_board_role_permissions" ADD FOREIGN KEY ("permission_id") REFERENCES "open_board_role_permission" ("id");
ALTER TABLE "open_board_user_roles" ADD FOREIGN KEY ("role_id") REFERENCES "open_board_role" ("id");
ALTER TABLE "open_board_user_roles" ADD FOREIGN KEY ("user_id") REFERENCES "open_board_user" ("id");
ALTER TABLE "open_board_external_provider_roles" ADD FOREIGN KEY ("role_id") REFERENCES "open_board_role" ("id");
ALTER TABLE "open_board_external_provider_roles" ADD FOREIGN KEY ("provider_id") REFERENCES "open_board_external_auth_provider" ("id");