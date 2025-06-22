import { z } from 'zod';

export const manualNutrientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.number().min(0, "Value must be positive"),
  unit: z.string().min(1, "Unit is required"),
});

export const manualBloodTestSchema = z.object({
  testDate: z.string().datetime(),
  nutrients: z.array(manualNutrientSchema).min(1, "Add at least one nutrient"),
});

export type ManualNutrientEntry = z.infer<typeof manualNutrientSchema>;
export type ManualBloodTestEntry = z.infer<typeof manualBloodTestSchema>;

export interface RecipeRecommendationParams {
  deficientNutrients: string[];
  dietaryPreferences?: string[];
  allergies?: string[];
  healthGoals?: string[];
}

export interface NutrientAnalysis {
  nutrientName: string;
  value: number;
  unit: string;
  status: 'deficient' | 'insufficient' | 'normal' | 'excess';
  severity: 'mild' | 'moderate' | 'severe' | null;
  minRange: number;
  maxRange: number;
}

export interface BloodTestResponse {
  testId: number;
  results: NutrientAnalysis[];
  recommendations: Array<{
    title: string;
    description: string;
    instructions: string;
    ingredients: Array<{
      name: string;
      amount: string;
      unit: string;
    }>;
    cookTime: number;
    servings: number;
    nutritionalBenefits: string[];
    targetNutrients: string[];
    dietaryTags: string[];
  }>;
}
