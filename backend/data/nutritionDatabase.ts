// Comprehensive nutrition database for food recommendations

export interface NutrientFood {
  name: string;
  category: string;
  servingSize: string;
  nutrientContent: number; // Amount per serving
  unit: string;
  bioavailability: 'high' | 'medium' | 'low'; // How well absorbed
  dietaryRestrictions: string[]; // vegetarian, vegan, gluten-free, etc.
  cookingTips?: string;
  otherNutrients?: string[]; // Other beneficial nutrients
}

export interface NutrientDatabase {
  [nutrient: string]: {
    description: string;
    deficiencySymptoms: string[];
    recommendedDailyIntake: {
      amount: number;
      unit: string;
    };
    absorptionTips: string[];
    foods: NutrientFood[];
  };
}

export const nutritionDatabase: NutrientDatabase = {
  "Vitamin D": {
    description: "Essential for bone health, immune function, and calcium absorption",
    deficiencySymptoms: ["Bone pain", "Muscle weakness", "Fatigue", "Depression", "Slow wound healing"],
    recommendedDailyIntake: { amount: 600, unit: "IU" },
    absorptionTips: [
      "Take with fat-containing meals for better absorption",
      "Get 10-15 minutes of sunlight daily",
      "Avoid taking with high-fiber meals"
    ],
    foods: [
      {
        name: "Salmon (wild-caught)",
        category: "Fish",
        servingSize: "3.5 oz (100g)",
        nutrientContent: 988,
        unit: "IU",
        bioavailability: "high",
        dietaryRestrictions: [],
        cookingTips: "Grill, bake, or pan-sear to retain nutrients",
        otherNutrients: ["Omega-3 fatty acids", "Protein", "B vitamins"]
      },
      {
        name: "Mackerel",
        category: "Fish", 
        servingSize: "3.5 oz (100g)",
        nutrientContent: 388,
        unit: "IU",
        bioavailability: "high",
        dietaryRestrictions: [],
        otherNutrients: ["Omega-3 fatty acids", "Protein"]
      },
      {
        name: "Egg yolks (pasture-raised)",
        category: "Dairy/Eggs",
        servingSize: "2 large yolks",
        nutrientContent: 80,
        unit: "IU",
        bioavailability: "high",
        dietaryRestrictions: ["vegetarian"],
        cookingTips: "Keep yolks runny to preserve nutrients",
        otherNutrients: ["Choline", "Protein", "Healthy fats"]
      },
      {
        name: "Fortified plant milk",
        category: "Plant-based",
        servingSize: "1 cup (240ml)",
        nutrientContent: 120,
        unit: "IU",
        bioavailability: "medium",
        dietaryRestrictions: ["vegan", "vegetarian"],
        otherNutrients: ["Calcium", "Protein (soy)"]
      },
      {
        name: "UV-exposed mushrooms",
        category: "Vegetables",
        servingSize: "1 cup (85g)",
        nutrientContent: 400,
        unit: "IU",
        bioavailability: "medium",
        dietaryRestrictions: ["vegan", "vegetarian", "gluten-free"],
        cookingTips: "Sauté to enhance flavor and absorption"
      }
    ]
  },
  "Vitamin B12": {
    description: "Critical for nerve function, DNA synthesis, and red blood cell formation",
    deficiencySymptoms: ["Fatigue", "Anemia", "Nerve problems", "Memory issues", "Depression"],
    recommendedDailyIntake: { amount: 2.4, unit: "mcg" },
    absorptionTips: [
      "Take with meals for better absorption",
      "Consider sublingual form if absorption issues",
      "Avoid taking with vitamin C supplements"
    ],
    foods: [
      {
        name: "Beef liver",
        category: "Meat",
        servingSize: "3 oz (85g)",
        nutrientContent: 70.7,
        unit: "mcg",
        bioavailability: "high",
        dietaryRestrictions: [],
        cookingTips: "Cook gently to avoid overcooking",
        otherNutrients: ["Iron", "Vitamin A", "Folate"]
      },
      {
        name: "Sardines",
        category: "Fish",
        servingSize: "3.5 oz (100g)",
        nutrientContent: 8.9,
        unit: "mcg",
        bioavailability: "high",
        dietaryRestrictions: [],
        otherNutrients: ["Omega-3 fatty acids", "Calcium"]
      },
      {
        name: "Nutritional yeast",
        category: "Plant-based",
        servingSize: "2 tbsp (15g)",
        nutrientContent: 7.8,
        unit: "mcg",
        bioavailability: "high",
        dietaryRestrictions: ["vegan", "vegetarian"],
        cookingTips: "Sprinkle on salads, pasta, or popcorn",
        otherNutrients: ["B vitamins", "Protein"]
      },
      {
        name: "Fortified cereals",
        category: "Grains",
        servingSize: "1 cup",
        nutrientContent: 6.0,
        unit: "mcg",
        bioavailability: "medium",
        dietaryRestrictions: ["vegetarian"],
        otherNutrients: ["Iron", "Folate", "Fiber"]
      },
      {
        name: "Swiss cheese",
        category: "Dairy",
        servingSize: "1 oz (28g)",
        nutrientContent: 0.95,
        unit: "mcg",
        bioavailability: "high",
        dietaryRestrictions: ["vegetarian"],
        otherNutrients: ["Calcium", "Protein"]
      }
    ]
  },
  "Iron": {
    description: "Essential for oxygen transport, energy production, and immune function",
    deficiencySymptoms: ["Fatigue", "Pale skin", "Shortness of breath", "Cold hands/feet", "Brittle nails"],
    recommendedDailyIntake: { amount: 18, unit: "mg" },
    absorptionTips: [
      "Take with vitamin C foods to enhance absorption",
      "Avoid taking with tea, coffee, or calcium",
      "Cook in cast iron cookware",
      "Separate from dairy and antacids"
    ],
    foods: [
      {
        name: "Beef sirloin",
        category: "Meat",
        servingSize: "3 oz (85g)",
        nutrientContent: 2.6,
        unit: "mg",
        bioavailability: "high",
        dietaryRestrictions: [],
        cookingTips: "Don't overcook to preserve nutrients",
        otherNutrients: ["Protein", "Zinc", "B vitamins"]
      },
      {
        name: "Spinach (cooked)",
        category: "Vegetables",
        servingSize: "1 cup (180g)",
        nutrientContent: 6.4,
        unit: "mg",
        bioavailability: "medium",
        dietaryRestrictions: ["vegan", "vegetarian", "gluten-free"],
        cookingTips: "Pair with vitamin C foods like lemon or tomatoes",
        otherNutrients: ["Folate", "Vitamin K", "Magnesium"]
      },
      {
        name: "Lentils (cooked)",
        category: "Legumes",
        servingSize: "1 cup (198g)",
        nutrientContent: 6.6,
        unit: "mg",
        bioavailability: "medium",
        dietaryRestrictions: ["vegan", "vegetarian", "gluten-free"],
        cookingTips: "Soak overnight and cook with vitamin C foods",
        otherNutrients: ["Protein", "Fiber", "Folate"]
      },
      {
        name: "Dark chocolate (70% cocoa)",
        category: "Treats",
        servingSize: "1 oz (28g)",
        nutrientContent: 3.9,
        unit: "mg",
        bioavailability: "medium",
        dietaryRestrictions: ["vegetarian"],
        otherNutrients: ["Magnesium", "Antioxidants"]
      },
      {
        name: "Pumpkin seeds",
        category: "Nuts/Seeds",
        servingSize: "1 oz (28g)",
        nutrientContent: 2.5,
        unit: "mg",
        bioavailability: "medium",
        dietaryRestrictions: ["vegan", "vegetarian", "gluten-free"],
        cookingTips: "Roast lightly to enhance flavor",
        otherNutrients: ["Zinc", "Magnesium", "Healthy fats"]
      }
    ]
  },
  "Ferritin": {
    description: "Iron storage protein that indicates iron stores in the body",
    deficiencySymptoms: ["Extreme fatigue", "Hair loss", "Restless leg syndrome", "Heavy periods"],
    recommendedDailyIntake: { amount: 18, unit: "mg" }, // Same as iron
    absorptionTips: [
      "Focus on iron-rich foods with vitamin C",
      "Avoid iron inhibitors during meals",
      "Consider iron supplements if severely low"
    ],
    foods: [
      // Same foods as iron since ferritin reflects iron stores
      {
        name: "Liver (chicken)",
        category: "Meat",
        servingSize: "3 oz (85g)",
        nutrientContent: 11.0,
        unit: "mg",
        bioavailability: "high",
        dietaryRestrictions: [],
        otherNutrients: ["Vitamin A", "B vitamins", "Copper"]
      },
      {
        name: "Oysters",
        category: "Seafood",
        servingSize: "6 medium oysters",
        nutrientContent: 5.0,
        unit: "mg",
        bioavailability: "high",
        dietaryRestrictions: [],
        otherNutrients: ["Zinc", "Vitamin B12", "Protein"]
      },
      {
        name: "White beans",
        category: "Legumes",
        servingSize: "1 cup (179g)",
        nutrientContent: 8.0,
        unit: "mg",
        bioavailability: "medium",
        dietaryRestrictions: ["vegan", "vegetarian", "gluten-free"],
        cookingTips: "Combine with vitamin C foods",
        otherNutrients: ["Protein", "Fiber", "Folate"]
      }
    ]
  },
  "Calcium": {
    description: "Essential for bone health, muscle function, and nerve transmission",
    deficiencySymptoms: ["Muscle cramps", "Numbness", "Weak/brittle nails", "Dental problems"],
    recommendedDailyIntake: { amount: 1000, unit: "mg" },
    absorptionTips: [
      "Take with vitamin D for better absorption",
      "Split doses throughout the day",
      "Avoid taking with iron supplements"
    ],
    foods: [
      {
        name: "Greek yogurt",
        category: "Dairy",
        servingSize: "1 cup (245g)",
        nutrientContent: 200,
        unit: "mg",
        bioavailability: "high",
        dietaryRestrictions: ["vegetarian"],
        otherNutrients: ["Protein", "Probiotics", "B vitamins"]
      },
      {
        name: "Sardines with bones",
        category: "Fish",
        servingSize: "3.5 oz (100g)",
        nutrientContent: 382,
        unit: "mg",
        bioavailability: "high",
        dietaryRestrictions: [],
        otherNutrients: ["Omega-3 fatty acids", "Vitamin D"]
      },
      {
        name: "Collard greens (cooked)",
        category: "Vegetables",
        servingSize: "1 cup (190g)",
        nutrientContent: 268,
        unit: "mg",
        bioavailability: "medium",
        dietaryRestrictions: ["vegan", "vegetarian", "gluten-free"],
        cookingTips: "Lightly steam to preserve nutrients",
        otherNutrients: ["Vitamin K", "Folate", "Vitamin A"]
      },
      {
        name: "Almonds",
        category: "Nuts/Seeds",
        servingSize: "1 oz (28g)",
        nutrientContent: 76,
        unit: "mg",
        bioavailability: "medium",
        dietaryRestrictions: ["vegan", "vegetarian", "gluten-free"],
        otherNutrients: ["Healthy fats", "Vitamin E", "Magnesium"]
      },
      {
        name: "Tahini",
        category: "Nuts/Seeds",
        servingSize: "2 tbsp (30g)",
        nutrientContent: 128,
        unit: "mg",
        bioavailability: "medium",
        dietaryRestrictions: ["vegan", "vegetarian", "gluten-free"],
        otherNutrients: ["Healthy fats", "Protein", "Magnesium"]
      }
    ]
  }
};

export function getFoodRecommendationsForNutrient(nutrientName: string, dietaryRestrictions: string[] = []): NutrientFood[] {
  const nutrientData = nutritionDatabase[nutrientName];
  if (!nutrientData) return [];

  let foods = nutrientData.foods;
  
  // Filter by dietary restrictions if provided
  if (dietaryRestrictions.length > 0) {
    foods = foods.filter(food => 
      dietaryRestrictions.every(restriction => 
        food.dietaryRestrictions.includes(restriction.toLowerCase())
      )
    );
  }

  // Sort by bioavailability and nutrient content
  return foods.sort((a, b) => {
    const bioavailabilityOrder = { high: 3, medium: 2, low: 1 };
    const bioCompare = bioavailabilityOrder[b.bioavailability] - bioavailabilityOrder[a.bioavailability];
    if (bioCompare !== 0) return bioCompare;
    return b.nutrientContent - a.nutrientContent;
  });
}

export function getNutrientInfo(nutrientName: string) {
  return nutritionDatabase[nutrientName] || null;
}
