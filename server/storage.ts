import {
  users,
  bloodTests,
  nutrients,
  bloodTestResults,
  recipes,
  mealPlans,
  mealPlanEntries,
  userRecipeRatings,
  type User,
  type UpsertUser,
  type BloodTest,
  type InsertBloodTest,
  type Nutrient,
  type BloodTestResult,
  type Recipe,
  type InsertRecipe,
  type MealPlan,
  type InsertMealPlan,
  type MealPlanEntry,
  type InsertMealPlanEntry,
  type UserRecipeRating,
  type InsertUserRecipeRating,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Blood test operations
  createBloodTest(bloodTest: InsertBloodTest): Promise<BloodTest>;
  getBloodTestsByUser(userId: string): Promise<BloodTest[]>;
  getLatestBloodTest(userId: string): Promise<BloodTest | undefined>;
  
  // Blood test results operations
  createBloodTestResult(result: Omit<BloodTestResult, 'id'>): Promise<BloodTestResult>;
  getBloodTestResults(bloodTestId: number): Promise<BloodTestResult[]>;
  getUserDeficiencies(userId: string): Promise<BloodTestResult[]>;
  
  // Nutrient operations
  getAllNutrients(): Promise<Nutrient[]>;
  getNutrientByName(name: string): Promise<Nutrient | undefined>;
  
  // Recipe operations
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  getAllRecipes(): Promise<Recipe[]>;
  getRecipesByNutrients(nutrients: string[]): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  
  // Meal plan operations
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  getUserActiveMealPlan(userId: string): Promise<MealPlan | undefined>;
  getMealPlanEntries(mealPlanId: number): Promise<(MealPlanEntry & { recipe?: Recipe | null })[]>;
  createMealPlanEntry(entry: InsertMealPlanEntry): Promise<MealPlanEntry>;
  updateMealPlanEntryCompletion(id: number, completed: boolean): Promise<void>;
  
  // Rating operations
  createUserRecipeRating(rating: InsertUserRecipeRating): Promise<UserRecipeRating>;
  getUserRecipeRating(userId: string, recipeId: number): Promise<UserRecipeRating | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Blood test operations
  async createBloodTest(bloodTest: InsertBloodTest): Promise<BloodTest> {
    const [test] = await db.insert(bloodTests).values(bloodTest).returning();
    return test;
  }

  async getBloodTestsByUser(userId: string): Promise<BloodTest[]> {
    return await db
      .select()
      .from(bloodTests)
      .where(eq(bloodTests.userId, userId))
      .orderBy(desc(bloodTests.testDate));
  }

  async getLatestBloodTest(userId: string): Promise<BloodTest | undefined> {
    const [test] = await db
      .select()
      .from(bloodTests)
      .where(eq(bloodTests.userId, userId))
      .orderBy(desc(bloodTests.testDate))
      .limit(1);
    return test;
  }

  // Blood test results operations
  async createBloodTestResult(result: Omit<BloodTestResult, 'id'>): Promise<BloodTestResult> {
    const [testResult] = await db.insert(bloodTestResults).values(result).returning();
    return testResult;
  }

  async getBloodTestResults(bloodTestId: number): Promise<BloodTestResult[]> {
    return await db
      .select()
      .from(bloodTestResults)
      .where(eq(bloodTestResults.bloodTestId, bloodTestId));
  }

  async getUserDeficiencies(userId: string): Promise<BloodTestResult[]> {
    const latestTest = await this.getLatestBloodTest(userId);
    if (!latestTest) return [];

    return await db
      .select()
      .from(bloodTestResults)
      .where(
        and(
          eq(bloodTestResults.bloodTestId, latestTest.id),
          inArray(bloodTestResults.status, ['deficient', 'insufficient'])
        )
      );
  }

  // Nutrient operations
  async getAllNutrients(): Promise<Nutrient[]> {
    return await db.select().from(nutrients);
  }

  async getNutrientByName(name: string): Promise<Nutrient | undefined> {
    const [nutrient] = await db.select().from(nutrients).where(eq(nutrients.name, name));
    return nutrient;
  }

  // Recipe operations
  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db.insert(recipes).values(recipe).returning();
    return newRecipe;
  }

  async getAllRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes).orderBy(desc(recipes.rating));
  }

  async getRecipesByNutrients(targetNutrients: string[]): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .where(
        // Check if any of the target nutrients are in the recipe's targetNutrients array
        // Using array overlap operator for PostgreSQL arrays
        sql`${recipes.targetNutrients} && ${targetNutrients}`
      )
      .orderBy(desc(recipes.rating));
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  // Meal plan operations
  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    // Deactivate existing active meal plans for the user
    await db
      .update(mealPlans)
      .set({ isActive: false })
      .where(and(eq(mealPlans.userId, mealPlan.userId), eq(mealPlans.isActive, true)));

    const [newMealPlan] = await db.insert(mealPlans).values(mealPlan).returning();
    return newMealPlan;
  }

  async getUserActiveMealPlan(userId: string): Promise<MealPlan | undefined> {
    const [activePlan] = await db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), eq(mealPlans.isActive, true)))
      .orderBy(desc(mealPlans.createdAt))
      .limit(1);
    return activePlan;
  }

  async getMealPlanEntries(mealPlanId: number): Promise<(MealPlanEntry & { recipe?: Recipe | null })[]> {
    return await db
      .select({
        id: mealPlanEntries.id,
        mealPlanId: mealPlanEntries.mealPlanId,
        date: mealPlanEntries.date,
        mealType: mealPlanEntries.mealType,
        recipeId: mealPlanEntries.recipeId,
        customMeal: mealPlanEntries.customMeal,
        completed: mealPlanEntries.completed,
        recipe: recipes,
      })
      .from(mealPlanEntries)
      .leftJoin(recipes, eq(mealPlanEntries.recipeId, recipes.id))
      .where(eq(mealPlanEntries.mealPlanId, mealPlanId))
      .orderBy(mealPlanEntries.date, mealPlanEntries.mealType);
  }

  async createMealPlanEntry(entry: InsertMealPlanEntry): Promise<MealPlanEntry> {
    const [newEntry] = await db.insert(mealPlanEntries).values(entry).returning();
    return newEntry;
  }

  async updateMealPlanEntryCompletion(id: number, completed: boolean): Promise<void> {
    await db
      .update(mealPlanEntries)
      .set({ completed })
      .where(eq(mealPlanEntries.id, id));
  }

  // Rating operations
  async createUserRecipeRating(rating: InsertUserRecipeRating): Promise<UserRecipeRating> {
    const [newRating] = await db.insert(userRecipeRatings).values(rating).returning();
    return newRating;
  }

  async getUserRecipeRating(userId: string, recipeId: number): Promise<UserRecipeRating | undefined> {
    const [rating] = await db
      .select()
      .from(userRecipeRatings)
      .where(
        and(
          eq(userRecipeRatings.userId, userId),
          eq(userRecipeRatings.recipeId, recipeId)
        )
      );
    return rating;
  }
}

export const storage = new DatabaseStorage();
