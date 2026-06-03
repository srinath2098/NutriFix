import { nutrientRanges } from './utils/nutrientRanges';
import { nutritionDatabase, getFoodRecommendationsForNutrient } from './data/nutritionDatabase';

// Initialize Mistral API configuration
if (!process.env.MISTRAL_API_KEY) {
  throw new Error('MISTRAL_API_KEY is required but not set in environment variables');
}

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

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

  // Check for presence of common blood test indicators
  const bloodTestIndicators = [
    /\b(lab|laboratory|test|result|report)\b/i,
    /\b(vitamin|mineral|protein|glucose|cholesterol)\b/i,
    /\b(mg\/dl|ng\/ml|μg\/dl|mmol\/l|iu\/ml)\b/i,
    /\b(normal|high|low|abnormal)\b/i,
    /\b(reference|range|level)\b/i
  ];

  const indicatorMatches = bloodTestIndicators.filter(pattern => pattern.test(processedText));
  if (indicatorMatches.length < 2) {
    warnings.push('Text may not be a blood test report');
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
    const preprocessing = preprocessBloodTestText(extractedText);
    
    if (preprocessing.confidence < 0.5) {
      throw new Error('Low confidence in text extraction quality');
    }

    const prompt = `You are a medical data extraction specialist. Extract blood test results from the following text and return a structured JSON response.

Text to analyze:
"""
${preprocessing.processedText}
"""

Please extract:
1. All nutrient/biomarker names and their values
2. Units of measurement
3. Reference ranges when available
4. Any status indicators (normal, high, low, etc.)

Return ONLY a valid JSON object with this exact structure:
{
  "nutrients": [
    {
      "name": "Vitamin D",
      "value": 32.5,
      "unit": "ng/mL",
      "status": "normal",
      "severity": "mild",
      "normalRange": {
        "min": 30,
        "max": 100
      }
    }
  ],
  "confidence": 0.95,
  "warnings": []
}

Rules:
- Extract ALL numeric values with their corresponding test names
- Use standardized nutrient names (e.g., "Vitamin D", "Vitamin B12", "Iron", "Ferritin")
- Status should be: "normal", "low", "high", or "deficient"
- Severity should be: "mild", "moderate", "severe" (only if abnormal)
- Include confidence score (0-1) based on text clarity
- Add warnings for any extraction uncertainties
- If reference ranges are not provided in the text, use standard medical ranges
- Do not include any text outside the JSON response`;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Mistral API failed: ${errorMessage}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response from Mistral API');
    }

    // Clean the response to extract just the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Mistral API');
    }

    const analysisResult = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!analysisResult.nutrients || !Array.isArray(analysisResult.nutrients)) {
      throw new Error('Invalid analysis result structure');
    }

    // Apply preprocessing warnings and confidence
    analysisResult.confidence = Math.min(
      analysisResult.confidence || 0.8, 
      preprocessing.confidence
    );
    analysisResult.warnings = [
      ...(analysisResult.warnings || []),
      ...preprocessing.warnings
    ];

    return analysisResult;

  } catch (error) {
    console.error('Blood test analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Blood test analysis failed: ${errorMessage}`);
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
    // Get detailed nutrition information for each deficient nutrient
    const nutrientInfo = deficiencies.map(nutrient => {
      const normalizedNutrient = normalizeNutrientName(nutrient);
      const range = normalizedNutrient ? nutrientRanges[normalizedNutrient as keyof typeof nutrientRanges] : null;
      const nutritionData = nutritionDatabase[normalizedNutrient || nutrient];
      const recommendedFoods = getFoodRecommendationsForNutrient(normalizedNutrient || nutrient, dietaryPreferences);
      
      return {
        name: nutrient,
        unit: range?.unit || 'unknown',
        deficiencySymptoms: nutritionData?.deficiencySymptoms || [],
        recommendedDailyIntake: nutritionData?.recommendedDailyIntake || { amount: 0, unit: 'unknown' },
        absorptionTips: nutritionData?.absorptionTips || [],
        topFoods: recommendedFoods.slice(0, 5), // Top 5 food sources
        recommendedSources: getRecommendedSources(nutrient)
      };
    });

    const prompt = `You are a nutritionist and chef. Create 3 healthy, delicious recipes that specifically address these nutrient deficiencies: ${deficiencies.join(', ')}.

DIETARY REQUIREMENTS:
- Dietary preferences: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'None'}
- Allergies to avoid: ${allergies.length > 0 ? allergies.join(', ') : 'None'}

DETAILED NUTRIENT INFORMATION:
${nutrientInfo.map(n => `
${n.name.toUpperCase()}:
- Daily need: ${n.recommendedDailyIntake.amount} ${n.recommendedDailyIntake.unit}
- Deficiency symptoms: ${n.deficiencySymptoms.join(', ')}
- Best food sources: ${n.topFoods.map(f => `${f.name} (${f.nutrientContent} ${f.unit} per ${f.servingSize})`).join(', ')}
- Absorption tips: ${n.absorptionTips.join('; ')}
`).join('\n')}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Recipe Name",
    "description": "Brief description of the recipe and its nutritional benefits",
    "instructions": "Detailed step-by-step cooking instructions",
    "ingredients": [
      {
        "name": "ingredient name",
        "amount": "1",
        "unit": "cup"
      }
    ],
    "cookTime": 30,
    "servings": 4,
    "nutritionalBenefits": ["High in Vitamin D", "Rich in Iron"],
    "targetNutrients": ["Vitamin D", "Iron"],
    "dietaryTags": ["vegetarian", "gluten-free"]
  }
]

RECIPE REQUIREMENTS:
- Each recipe MUST include foods that are rich in the deficient nutrients
- Target at least 20% of daily needs for the nutrient per serving
- Include specific quantities of nutrient-rich ingredients
- Provide realistic cooking times and serving sizes
- Give clear, step-by-step cooking instructions
- List exact nutritional benefits and nutrient amounts
- Include appropriate dietary tags (vegetarian, vegan, gluten-free, etc.)
- Use commonly available ingredients
- Avoid all allergenic ingredients mentioned above
- Respect all dietary preferences mentioned above
- Include cooking tips that enhance nutrient absorption
- Make recipes appetizing and family-friendly

EXAMPLE CONSIDERATIONS:
- For Vitamin D: Include fatty fish, egg yolks, or fortified foods
- For Iron: Pair iron-rich foods with vitamin C sources
- For B12: Focus on animal products or fortified plant foods
- For Calcium: Include dairy, leafy greens, or fortified alternatives`;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Mistral API failed: ${errorMessage}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response from Mistral API');
    }

    // Clean the response to extract just the JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Mistral API');
    }

    const recipes = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(recipes)) {
      throw new Error('Expected array of recipes');
    }

    return recipes;

  } catch (error) {
    console.error('Recipe generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Recipe generation failed: ${errorMessage}`);
  }
}

export async function generateWeeklyMealPlan(
  userDeficiencies: string[],
  userPreferences: {
    dietaryPreferences: string[];
    allergies: string[];
    healthGoals: string[];
  }
): Promise<any> {
  try {
    const prompt = `Create a 7-day meal plan that addresses these nutrient deficiencies: ${userDeficiencies.join(', ')}.

User preferences:
- Dietary preferences: ${userPreferences.dietaryPreferences.join(', ') || 'None'}
- Allergies: ${userPreferences.allergies.join(', ') || 'None'}
- Health goals: ${userPreferences.healthGoals.join(', ') || 'General wellness'}

Return ONLY a valid JSON object with this structure:
{
  "weekPlan": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": {
          "name": "Meal name",
          "description": "Brief description",
          "targetNutrients": ["Vitamin D", "Iron"]
        },
        "lunch": {
          "name": "Meal name",
          "description": "Brief description",
          "targetNutrients": ["Vitamin B12"]
        },
        "dinner": {
          "name": "Meal name",
          "description": "Brief description",
          "targetNutrients": ["Iron", "Calcium"]
        }
      }
    }
  ],
  "nutritionalSummary": {
    "targetedDeficiencies": ["Vitamin D", "Iron", "Vitamin B12"],
    "weeklyNutrientFocus": "Brief summary of how the week addresses deficiencies"
  }
}

Requirements:
- Plan for 7 days (Monday to Sunday)
- Each day should have breakfast, lunch, and dinner
- Meals should specifically target the nutrient deficiencies
- Respect dietary preferences and avoid allergies
- Include variety throughout the week
- Provide realistic, achievable meal suggestions`;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Mistral API failed: ${errorMessage}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response from Mistral API');
    }

    // Clean the response to extract just the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Mistral API');
    }

    const mealPlan = JSON.parse(jsonMatch[0]);
    return mealPlan;

  } catch (error) {
    console.error('Meal plan generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Meal plan generation failed: ${errorMessage}`);
  }
}

// Helper functions
function normalizeNutrientName(name: string): string | null {
  const normalized = name.toLowerCase().trim();
  const mappings: { [key: string]: string } = {
    'vitamin d': 'Vitamin D',
    'vit d': 'Vitamin D',
    'd3': 'Vitamin D',
    'vitamin b12': 'Vitamin B12',
    'b12': 'Vitamin B12',
    'cobalamin': 'Vitamin B12',
    'iron': 'Iron',
    'fe': 'Iron',
    'ferritin': 'Ferritin',
    'calcium': 'Calcium',
    'ca': 'Calcium'
  };
  
  return mappings[normalized] || null;
}

function getRecommendedSources(nutrient: string): string[] {
  const sources: { [key: string]: string[] } = {
    'Vitamin D': ['fatty fish', 'egg yolks', 'fortified dairy', 'mushrooms', 'cod liver oil'],
    'Vitamin B12': ['meat', 'fish', 'dairy products', 'eggs', 'fortified cereals'],
    'Iron': ['red meat', 'spinach', 'lentils', 'quinoa', 'dark chocolate', 'tofu'],
    'Ferritin': ['lean meats', 'beans', 'nuts', 'dried fruits', 'dark leafy greens'],
    'Calcium': ['dairy products', 'leafy greens', 'almonds', 'sardines', 'tofu']
  };

  const normalizedNutrient = normalizeNutrientName(nutrient);
  return sources[normalizedNutrient || nutrient] || ['varied whole foods'];
}
