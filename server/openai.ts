import OpenAI from "openai";
import { nutrientRanges, analyzeNutrientValue } from './utils/nutrientRanges';

// Initialize OpenAI client with API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required but not set in environment variables');
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000 // 30 seconds timeout
});

export interface BloodTestAnalysis {
  nutrients: Array<{
    name: string;
    value: number;
    unit: string;
    status: 'normal' | 'low' | 'high' | 'deficient';
    severity?: 'mild' | 'moderate' | 'severe';
    normalRange: {
      min: number;
      max: number;
    };
  }>;
  confidence: number;
  warnings?: string[];
}

interface TextPreprocessingResult {
  processedText: string;
  confidence: number;
  warnings: string[];
}

function preprocessBloodTestText(text: string): TextPreprocessingResult {
  let warnings: string[] = [];
  let confidence = 1.0;

  // Remove any PDF artifacts or common OCR errors
  let processedText = text
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  // Check for common issues
  if (processedText.length < 100) {
    warnings.push('Text appears too short for a blood test report');
    confidence *= 0.7;
  }

  if (!/\d/.test(processedText)) {
    warnings.push('No numerical values found in the text');
    confidence *= 0.5;
  }

  const commonLabTerms = ['hemoglobin', 'glucose', 'cholesterol', 'vitamin', 'iron', 'calcium'];
  const foundTerms = commonLabTerms.filter(term => 
    processedText.toLowerCase().includes(term)
  );

  if (foundTerms.length < 2) {
    warnings.push('Few common blood test terms found');
    confidence *= 0.8;
  }

  return {
    processedText,
    confidence,
    warnings
  };
}

export async function analyzeBloodTestText(extractedText: string): Promise<BloodTestAnalysis> {
  try {
    const { processedText, confidence, warnings } = preprocessBloodTestText(extractedText);

    if (confidence < 0.3) {
      throw new Error('Text quality too low for reliable analysis. Please provide clearer data.');
    }

    const systemPrompt = `You are a medical laboratory AI assistant analyzing blood test results. Extract nutrient values and provide a detailed analysis following these rules:
1. Only include nutrients that are clearly present in the test results
2. Use standardized units where possible (e.g., ng/mL, µg/dL)
3. Be conservative in flagging abnormal values
4. Include confidence levels for each assessment
5. Note any potential data quality issues
6. For manual entry data, validate against known reference ranges`;

    const userPrompt = `Analyze these blood test results and return a JSON response with nutrient data:
${processedText}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No analysis results received');
    }

    let analysis: BloodTestAnalysis;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      throw new Error('Failed to parse analysis results');
    }

    // Validate the response format
    if (!analysis.nutrients || !Array.isArray(analysis.nutrients)) {
      throw new Error('Invalid response format from analysis');
    }

    // Validate each nutrient entry
    analysis.nutrients = analysis.nutrients.map(nutrient => {
      if (!nutrient.name || !nutrient.value || !nutrient.unit) {
        warnings.push(`Incomplete data for nutrient: ${nutrient.name || 'unknown'}`);
        return null;
      }
      return nutrient;
    }).filter((n): n is NonNullable<typeof n> => n !== null);

    if (analysis.nutrients.length === 0) {
      throw new Error('No valid nutrient data found in analysis');
    }

    // Add the confidence score and any warnings
    return {
      ...analysis,
      confidence: Math.min(confidence, analysis.confidence || 1),
      warnings: [...warnings, ...(analysis.warnings || [])]
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Blood test analysis failed: ${error.message}`);
    }
    throw error;
  }
}

export interface RecipeRecommendation {
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
}

export async function generateRecipeRecommendations(
  deficiencies: string[],
  dietaryPreferences: string[] = [],
  allergies: string[] = []
): Promise<RecipeRecommendation[]> {
  try {
    // Map nutrient names to their reference ranges and recommended sources
    const nutrientInfo = deficiencies.map(nutrient => {
      const normalizedNutrient = normalizeNutrientName(nutrient);
      const range = normalizedNutrient ? nutrientRanges[normalizedNutrient as keyof typeof nutrientRanges] : null;
      return {
        name: nutrient,
        unit: range?.unit || 'unknown',
        recommendedSources: getRecommendedSources(nutrient)
      };
    });

    const prompt = `
Generate 3 personalized recipe recommendations to address these nutrient deficiencies:
${nutrientInfo.map(n => `- ${n.name} (common sources: ${n.recommendedSources.join(', ')})`).join('\n')}

Requirements:
- Dietary preferences: ${dietaryPreferences.join(', ') || 'None specified'}
- Allergies to avoid: ${allergies.join(', ') || 'None specified'}

Guidelines:
1. Focus on nutrient-dense ingredients that address multiple deficiencies
2. Include preparation methods that maximize nutrient absorption
3. Combine ingredients that enhance bioavailability
4. Keep recipes practical and achievable
5. Balance nutrition and taste

Return JSON format:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "description": "Brief description highlighting nutrient benefits",
      "instructions": "Step-by-step cooking instructions",
      "ingredients": [
        {
          "name": "ingredient name",
          "amount": "1",
          "unit": "cup"
        }
      ],
      "cookTime": 30,
      "servings": 4,
      "nutritionalBenefits": ["High in iron", "Rich in vitamin D"],
      "targetNutrients": ["iron", "vitamin D"],
      "dietaryTags": ["vegetarian", "gluten-free"]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert and chef specializing in therapeutic cooking. 
Create healthy, practical recipes that effectively address nutrient deficiencies while considering:
- Nutrient bioavailability
- Complementary ingredients that enhance absorption
- Food combinations that may inhibit absorption
- Cooking methods that preserve nutrients`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No recipe recommendations received');
    }

    let recommendations: { recipes: RecipeRecommendation[] };
    try {
      recommendations = JSON.parse(content);
    } catch (e) {
      throw new Error('Failed to parse recipe recommendations');
    }

    if (!recommendations.recipes || !Array.isArray(recommendations.recipes)) {
      throw new Error('Invalid recipe recommendations format');
    }

    // Validate each recipe
    const validatedRecipes = recommendations.recipes.map(recipe => {
      if (!recipe.title || !recipe.instructions || !recipe.ingredients) {
        throw new Error('Invalid recipe format');
      }
      
      // Ensure all recipes target at least one deficient nutrient
      if (!recipe.targetNutrients?.some(n => deficiencies.includes(n.toLowerCase()))) {
        throw new Error('Recipe does not target any deficient nutrients');
      }

      return recipe;
    });

    return validatedRecipes;
  } catch (error) {
    throw new Error("Failed to generate recipe recommendations: " + (error as Error).message);
  }
}

// Helper functions
function normalizeNutrientName(nutrient: string): string | null {
  const normalized = nutrient.toLowerCase().trim();
  const knownNutrients = {
    'vitamin d': 'Vitamin D',
    'vitamin b12': 'Vitamin B12',
    'iron': 'Iron',
    'ferritin': 'Ferritin',
    'calcium': 'Calcium',
  };
  return knownNutrients[normalized as keyof typeof knownNutrients] || null;
}

function getRecommendedSources(nutrient: string): string[] {
  const sourceMap: Record<string, string[]> = {
    "Vitamin D": ["fatty fish", "egg yolks", "fortified dairy", "mushrooms"],
    "Vitamin B12": ["lean meats", "fish", "eggs", "dairy products", "fortified cereals"],
    "Iron": ["red meat", "leafy greens", "legumes", "fortified cereals"],
    "Calcium": ["dairy products", "leafy greens", "fortified plant milks", "tofu"],
    "Magnesium": ["nuts", "seeds", "whole grains", "leafy greens"],
    "Zinc": ["oysters", "meat", "legumes", "nuts", "seeds"],
    "Folate": ["leafy greens", "legumes", "citrus fruits", "fortified grains"],
    "Vitamin C": ["citrus fruits", "berries", "bell peppers", "broccoli"],
  };

  const normalizedNutrient = normalizeNutrientName(nutrient);
  return normalizedNutrient ? (sourceMap[normalizedNutrient] || ["varied whole foods"]) : ["varied whole foods"];
}

export async function generateWeeklyMealPlan(
  recipes: Array<{ id: number; title: string; targetNutrients: string[] }>,
  deficiencies: string[]
): Promise<Array<{
  date: string;
  meals: {
    breakfast?: { recipeId?: number; customMeal?: string };
    lunch?: { recipeId?: number; customMeal?: string };
    dinner?: { recipeId?: number; customMeal?: string };
  };
}>> {
  try {
    const prompt = `
Create a 7-day meal plan using the provided recipes and addressing these deficiencies: ${deficiencies.join(', ')}.

Available recipes:
${recipes.map(r => `- ID ${r.id}: ${r.title} (targets: ${r.targetNutrients.join(', ')})`).join('\n')}

Return JSON format:
{
  "mealPlan": [
    {
      "date": "2024-03-18",
      "meals": {
        "breakfast": { "recipeId": 1 },
        "lunch": { "customMeal": "Greek yogurt with berries" },
        "dinner": { "recipeId": 2 }
      }
    }
  ]
}

Guidelines:
- Use recipeId for provided recipes
- Use customMeal for simple, healthy suggestions not in the recipe list
- Prioritize recipes that target deficient nutrients
- Ensure variety throughout the week
- Balance nutrition across all meals
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a meal planning expert. Create balanced, practical weekly meal plans."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const mealPlan = JSON.parse(response.choices[0].message.content || '{"mealPlan": []}');
    return mealPlan.mealPlan;
  } catch (error) {
    throw new Error("Failed to generate meal plan: " + (error as Error).message);
  }
}
