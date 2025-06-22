import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function migrate() {
  try {
    // Add columns to blood_tests table
    await db.execute(sql`
      ALTER TABLE "blood_tests"
      ADD COLUMN IF NOT EXISTS "source" varchar DEFAULT 'file',
      ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "confidence" real DEFAULT 1.0,
      ADD COLUMN IF NOT EXISTS "warnings" text[],
      ADD COLUMN IF NOT EXISTS "processed_at" timestamp;
    `);

    // Add columns to blood_test_results table
    await db.execute(sql`
      ALTER TABLE "blood_test_results"
      ADD COLUMN IF NOT EXISTS "nutrient_name" varchar NOT NULL,
      ADD COLUMN IF NOT EXISTS "unit" varchar NOT NULL,
      ADD COLUMN IF NOT EXISTS "min_range" real NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "max_range" real NOT NULL DEFAULT 100;
    `);

    // Update the unique constraint on nutrients
    await db.execute(sql`
      ALTER TABLE "nutrients"
      DROP CONSTRAINT IF EXISTS "nutrients_name_unique";

      CREATE UNIQUE INDEX IF NOT EXISTS "nutrients_name_unique_lower" 
      ON "nutrients" (LOWER(name));
    `);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
