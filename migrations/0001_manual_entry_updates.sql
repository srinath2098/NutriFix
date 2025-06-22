-- Add additional columns to blood_tests table
ALTER TABLE "blood_tests"
  ADD COLUMN "source" varchar DEFAULT 'file',
  ADD COLUMN "status" varchar DEFAULT 'pending',
  ADD COLUMN "confidence" real DEFAULT 1.0,
  ADD COLUMN "warnings" text[],
  ADD COLUMN "processed_at" timestamp;

-- Add additional columns to blood_test_results table
ALTER TABLE "blood_test_results"
  ADD COLUMN "nutrient_name" varchar NOT NULL,
  ADD COLUMN "unit" varchar NOT NULL,
  ADD COLUMN "min_range" real NOT NULL DEFAULT 0,
  ADD COLUMN "max_range" real NOT NULL DEFAULT 100;

-- Update the unique constraint on nutrients to be case-insensitive
ALTER TABLE "nutrients"
  DROP CONSTRAINT "nutrients_name_unique";

CREATE UNIQUE INDEX "nutrients_name_unique_lower" ON "nutrients" (LOWER(name));
