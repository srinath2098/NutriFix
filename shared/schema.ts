import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Additional health-related fields
  dietaryPreferences: text("dietary_preferences").array(),
  allergies: text("allergies").array(),
  healthGoals: text("health_goals").array(),
});

export const bloodTests = pgTable("blood_tests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  testDate: timestamp("test_date").notNull(),
  fileName: varchar("file_name"),
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at").defaultNow(),
  source: varchar("source").default("file"),
  status: varchar("status").default("pending"),
  confidence: real("confidence").default(1.0),
  warnings: text("warnings").array(),
  processedAt: timestamp("processed_at"),
});

export const nutrients = pgTable("nutrients", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  unit: varchar("unit").notNull(),
  normalRangeMin: real("normal_range_min"),
  normalRangeMax: real("normal_range_max"),
  description: text("description"),
});

export const bloodTestResults = pgTable("blood_test_results", {
  id: serial("id").primaryKey(),
  bloodTestId: integer("blood_test_id")
    .notNull()
    .references(() => bloodTests.id),
  nutrientName: varchar("nutrient_name").notNull(),
  value: real("value").notNull(),
  unit: varchar("unit").notNull(),
  status: varchar("status").notNull(),
  severity: varchar("severity"),
  minRange: real("min_range").notNull(),
  maxRange: real("max_range").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  instructions: text("instructions").notNull(),
  ingredients: jsonb("ingredients").notNull(), // Array of {name, amount, unit}
  cookTime: integer("cook_time"), // in minutes
  servings: integer("servings"),
  imageUrl: varchar("image_url"),
  rating: real("rating"),
  nutritionalBenefits: text("nutritional_benefits").array(),
  targetNutrients: text("target_nutrients").array(),
  dietaryTags: text("dietary_tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekStartDate: timestamp("week_start_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealPlanEntries = pgTable("meal_plan_entries", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").notNull().references(() => mealPlans.id),
  date: timestamp("date").notNull(),
  mealType: varchar("meal_type").notNull(), // 'breakfast', 'lunch', 'dinner', 'snack'
  recipeId: integer("recipe_id").references(() => recipes.id),
  customMeal: varchar("custom_meal"),
  completed: boolean("completed").default(false),
});

export const userRecipeRatings = pgTable("user_recipe_ratings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id),
  rating: integer("rating").notNull(), // 1-5 stars
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertBloodTestSchema = createInsertSchema(bloodTests);
export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
});
export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true,
});
export const insertMealPlanEntrySchema = createInsertSchema(mealPlanEntries).omit({
  id: true,
});
export const insertUserRecipeRatingSchema = createInsertSchema(userRecipeRatings).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertBloodTest = z.infer<typeof insertBloodTestSchema>;
export type BloodTest = typeof bloodTests.$inferSelect;
export type Nutrient = typeof nutrients.$inferSelect;
export type BloodTestResult = typeof bloodTestResults.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlanEntry = typeof mealPlanEntries.$inferSelect;
export type InsertMealPlanEntry = z.infer<typeof insertMealPlanEntrySchema>;
export type UserRecipeRating = typeof userRecipeRatings.$inferSelect;
export type InsertUserRecipeRating = z.infer<typeof insertUserRecipeRatingSchema>;
