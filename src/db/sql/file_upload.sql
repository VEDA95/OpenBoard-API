CREATE TABLE "open_board_file_upload" (
  "id" UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "date_created" TIMESTAMP NOT NULL DEFAULT now(),
  "date_updated" TIMESTAMP,
  "file_path" VARCHAR(255) NOT NULL,
  "file_size" INTEGER NOT NULL,
  "additional_details" JSONB
);

ALTER TABLE IF EXISTS "open_board_user" ADD FOREIGN KEY ("thumbnail") REFERENCES "open_board_file_upload" ("id");