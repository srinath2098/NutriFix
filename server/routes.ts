import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  bloodTests,
  users,
  type BloodTest
} from "@shared/schema";
import { analyzeNutrientValue } from "./utils/nutrientRanges";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeBloodTestText, generateRecipeRecommendations } from "./openai";
import { storage } from "./storage";
import multer from "multer";
import { apiLimiter, authLimiter, openAILimiter } from "./middleware/rateLimit";
import { z } from "zod";
import { handleManualBloodTestEntry } from "./routes/bloodTests";
import { manualBloodTestSchema, type ManualBloodTestEntry } from '@shared/types';
import { processBloodTestNutrients } from './utils/nutrientAnalysis';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'));
    }
  },
});

// Initialize storage

const manualEntrySchema = z.object({
  testDate: z.string(),
  nutrients: z.array(z.object({
    name: z.string(),
    value: z.number(),
    unit: z.string()
  }))
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize auth middleware
  await setupAuth(app);

  // Rate limiting for API endpoints
  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);
  app.use('/api/openai', openAILimiter);
  
  // Rate limiting
  app.use('/api/', apiLimiter);
  app.use(['/api/login', '/api/callback'], authLimiter);
  app.use(['/api/bloodtest', '/api/recipes/recommended', '/api/meal-plan/generate'], openAILimiter);
  app.use('/api/bloodtest/manual', openAILimiter); // Add OpenAI rate limit since we use it for analysis
  
  // Protected routes
  app.use(['/api/bloodtest', '/api/recipes', '/api/meal-plan'], isAuthenticated);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', authenticated: req.oidc?.isAuthenticated() ?? false });
  });

  // Update user preferences
  app.patch('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      const { dietaryPreferences, allergies, healthGoals } = req.body;
      
      const updatedUser = await storage.upsertUser({
        id: userId,
        email: req.oidc.user.email,
        firstName: req.oidc.user.given_name,
        lastName: req.oidc.user.family_name,
        profileImageUrl: req.oidc.user.picture,
        dietaryPreferences,
        allergies,
        healthGoals,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Protected routes
  app.use(['/api/bloodtest', '/api/recipes', '/api/meal-plan'], isAuthenticated);

  // Manual blood test entry
  app.post('/api/bloodtest/manual', isAuthenticated, handleManualBloodTestEntry);

  // Blood test routes
  app.post('/api/bloodtest', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      const { testDate, extractedText } = req.body;
      
      if (!extractedText) {
        return res.status(400).json({ message: "Extracted text is required" });
      }

      const bloodTestData = insertBloodTestSchema.parse({
        userId,
        testDate: new Date(testDate),
        fileName: req.file?.originalname,
        extractedText,
      });

      const bloodTest = await storage.createBloodTest(bloodTestData);
      
      // Analyze the extracted text with OpenAI
      const analysis = await analyzeBloodTestText(extractedText);
      
      // Store the analysis results
      for (const nutrientResult of analysis.nutrients) {
        // Get or create nutrient record
        let nutrient = await storage.getNutrientByName(nutrientResult.name);
        if (!nutrient) {
          // For now, we'll skip nutrients we don't have in our database
          // In production, you might want to create them dynamically
          continue;
        }

        await storage.createBloodTestResult({
          bloodTestId: bloodTest.id,
          nutrientId: nutrient.id,
          value: nutrientResult.value,
          status: nutrientResult.status,
          severity: nutrientResult.severity ?? null,
        });
      }

      res.json({ bloodTest, analysis });
    } catch (error) {
      console.error("Error processing blood test:", error);
      res.status(500).json({ message: "Failed to process blood test" });
    }
  });

  app.get('/api/bloodtest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      const bloodTests = await storage.getBloodTestsByUser(userId);
      res.json(bloodTests);
    } catch (error) {
      console.error("Error fetching blood tests:", error);
      res.status(500).json({ message: "Failed to fetch blood tests" });
    }
  });

  app.get('/api/bloodtest/latest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      const latestTest = await storage.getLatestBloodTest(userId);
      
      if (!latestTest) {
        return res.json(null);
      }

      const results = await storage.getBloodTestResults(latestTest.id);
      res.json({ ...latestTest, results });
    } catch (error) {
      console.error("Error fetching latest blood test:", error);
      res.status(500).json({ message: "Failed to fetch latest blood test" });
    }
  });

  // Deficiency routes
  app.get('/api/deficiencies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      const deficiencies = await storage.getUserDeficiencies(userId);
      res.json(deficiencies);
    } catch (error) {
      console.error("Error fetching deficiencies:", error);
      res.status(500).json({ message: "Failed to fetch deficiencies" });
    }
  });

  // Recipe routes
  app.get('/api/recipes', isAuthenticated, async (req: any, res) => {
    try {
      const { nutrients } = req.query;
      
      if (nutrients) {
        const nutrientArray = Array.isArray(nutrients) ? nutrients : [nutrients];
        const recipes = await storage.getRecipesByNutrients(nutrientArray);
        res.json(recipes);
      } else {
        const recipes = await storage.getAllRecipes();
        res.json(recipes);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get('/api/recipes/recommended', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      const user = await storage.getUser(userId);
      const deficiencies = await storage.getUserDeficiencies(userId);
      
      if (deficiencies.length === 0) {
        return res.json([]);
      }

      const deficientNutrients = deficiencies.map(d => d.nutrient.name);
      
      // First try to get existing recipes that target these nutrients
      const existingRecipes = await storage.getRecipesByNutrients(deficientNutrients);
      
      if (existingRecipes.length > 0) {
        res.json(existingRecipes.slice(0, 6)); // Return top 6
      } else {
        // Generate new recipes using OpenAI
        const newRecipes = await generateRecipeRecommendations(
          deficientNutrients,
          user?.dietaryPreferences || [],
          user?.allergies || []
        );
        
        // Store the generated recipes
        const storedRecipes = [];
        for (const recipe of newRecipes) {
          const stored = await storage.createRecipe({
            title: recipe.title,
            description: recipe.description,
            instructions: recipe.instructions,
            ingredients: recipe.ingredients,
            cookTime: recipe.cookTime,
            servings: recipe.servings,
            rating: 4.5, // Default rating for AI-generated recipes
            nutritionalBenefits: recipe.nutritionalBenefits,
            targetNutrients: recipe.targetNutrients,
            dietaryTags: recipe.dietaryTags,
          });
          storedRecipes.push(stored);
        }
        
        res.json(storedRecipes);
      }
    } catch (error) {
      console.error("Error generating recommended recipes:", error);
      res.status(500).json({ message: "Failed to generate recommended recipes" });
    }
  });

  app.get('/api/recipes/:id', isAuthenticated, async (req, res) => {
    try {
      const recipe = await storage.getRecipe(parseInt(req.params.id));
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Meal plan routes
  app.get('/api/meal-plan/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      const activePlan = await storage.getUserActiveMealPlan(userId);
      
      if (!activePlan) {
        return res.json(null);
      }

      const entries = await storage.getMealPlanEntries(activePlan.id);
      res.json({ ...activePlan, entries });
    } catch (error) {
      console.error("Error fetching current meal plan:", error);
      res.status(500).json({ message: "Failed to fetch current meal plan" });
    }
  });

  app.post('/api/meal-plan/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      const deficiencies = await storage.getUserDeficiencies(userId);
      
      if (deficiencies.length === 0) {
        return res.status(400).json({ message: "No deficiencies found to address" });
      }

      const deficientNutrients = deficiencies.map(d => d.nutrient.name);
      const availableRecipes = await storage.getRecipesByNutrients(deficientNutrients);
      
      // Create a new meal plan
      const weekStartDate = new Date();
      weekStartDate.setHours(0, 0, 0, 0);
      
      const mealPlan = await storage.createMealPlan({
        userId,
        weekStartDate,
        isActive: true,
      });

      // Generate meal plan with OpenAI
      const weeklyPlan = await generateWeeklyMealPlan(
        availableRecipes.map(r => ({
          id: r.id,
          title: r.title,
          targetNutrients: r.targetNutrients || [],
        })),
        deficientNutrients
      );

      // Store meal plan entries
      const entries = [];
      for (const day of weeklyPlan) {
        const date = new Date(day.date);
        
        for (const [mealType, meal] of Object.entries(day.meals)) {
          const entry = await storage.createMealPlanEntry({
            mealPlanId: mealPlan.id,
            date,
            mealType,
            recipeId: meal.recipeId || null,
            customMeal: meal.customMeal || null,
            completed: false,
          });
          entries.push(entry);
        }
      }

      res.json({ ...mealPlan, entries });
    } catch (error) {
      console.error("Error generating meal plan:", error);
      res.status(500).json({ message: "Failed to generate meal plan" });
    }
  });

  app.patch('/api/meal-plan/entries/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const { completed } = req.body;
      await storage.updateMealPlanEntryCompletion(parseInt(req.params.id), completed);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating meal plan entry:", error);
      res.status(500).json({ message: "Failed to update meal plan entry" });
    }
  });

  // Nutrient routes
  app.get('/api/nutrients', async (req, res) => {
    try {
      const nutrients = await storage.getAllNutrients();
      res.json(nutrients);
    } catch (error) {
      console.error("Error fetching nutrients:", error);
      res.status(500).json({ message: "Failed to fetch nutrients" });
    }
  });

  // Rating routes
  app.post('/api/recipes/:id/rate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      const recipeId = parseInt(req.params.id);
      const { rating, notes } = req.body;

      const userRating = await storage.createUserRecipeRating({
        userId,
        recipeId,
        rating,
        notes,
      });

      res.json(userRating);
    } catch (error) {
      console.error("Error rating recipe:", error);
      res.status(500).json({ message: "Failed to rate recipe" });
    }
  });

  app.post('/api/recipes', isAuthenticated, async (req, res) => {
    try {
      const { title, description, instructions, ingredients, targetNutrients } = req.body;
      if (!title || !instructions || !ingredients) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const recipe = await storage.createRecipe({
        title,
        description,
        instructions,
        ingredients,
        targetNutrients,
      });
      res.json(recipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  // Blood test upload and analysis endpoint
  app.post('/api/blood-tests', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No file uploaded',
          code: 'FILE_MISSING' 
        });
      }

      // Validate file size
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'File too large. Maximum size is 10MB',
          code: 'FILE_TOO_LARGE'
        });
      }

      // Validate MIME type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          error: 'Invalid file type. Only PDF, JPEG, and PNG files are allowed',
          code: 'INVALID_FILE_TYPE'
        });
      }

      // Validate extracted text
      const extractedText = req.body.extractedText;
      if (!extractedText || typeof extractedText !== 'string' || extractedText.length < 10) {
        return res.status(400).json({ 
          error: 'Invalid or missing text extraction results',
          code: 'INVALID_TEXT'
        });
      }

      // Start analysis
      const analysis = await analyzeBloodTestText(extractedText);

      // Check analysis confidence
      if (analysis.confidence < 0.5) {
        return res.status(422).json({
          error: 'Low confidence in analysis results. Please provide a clearer image.',
          code: 'LOW_CONFIDENCE',
          warnings: analysis.warnings
        });
      }

      // Save the blood test results
      const bloodTest = await db
        .insert(bloodTests)
        .values({
          userId,
          testDate: new Date(req.body.testDate),
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          extractedText,
          confidence: analysis.confidence,
          warnings: analysis.warnings || [],
        })
        .returning()
        .then(rows => rows[0]);

      // Save individual nutrient results
      const promises = analysis.nutrients.map(nutrient => 
        db.insert(bloodTestResults)
          .values({
            bloodTestId: bloodTest.id,
            nutrientName: nutrient.name,
            value: nutrient.value,
            unit: nutrient.unit,
            status: nutrient.status,
            severity: nutrient.severity,
            minRange: nutrient.normalRange.min,
            maxRange: nutrient.normalRange.max,
          })
      );

      await Promise.all(promises);

      // Generate recipe recommendations based on analysis
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then(rows => rows[0]);

      const recommendations = await generateRecipeRecommendations(
        analysis.nutrients
          .filter(n => n.status !== 'normal')
          .map(n => n.name),
        {
          dietaryPreferences: user?.dietaryPreferences || [],
          allergies: user?.allergies || [],
          healthGoals: user?.healthGoals || []
        }
      );

      res.json({
        status: 'success',
        bloodTest,
        analysis,
        recommendations
      });

    } catch (error) {
      console.error('Blood test upload error:', error);
      
      const isOpenAIError = error instanceof Error && error.message.includes('OpenAI');
      
      res.status(isOpenAIError ? 503 : 500).json({
        error: isOpenAIError 
          ? 'Analysis service temporarily unavailable. Please try again later.'
          : 'Failed to process blood test results',
        code: isOpenAIError ? 'ANALYSIS_UNAVAILABLE' : 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Manual blood test entry endpoint
  app.post('/api/bloodtest/manual', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.oidc.user.sub;
      const validatedData = manualBloodTestSchema.parse(req.body) as ManualBloodTestEntry;
      
      // Create blood test record
      const [bloodTest] = await db.insert(bloodTests)
        .values({
          userId,
          testDate: new Date(validatedData.testDate),
          fileName: 'manual-entry',
          fileType: 'manual',
          fileSize: 0,
          extractedText: JSON.stringify(validatedData.nutrients),
          confidence: 1.0,
          warnings: []
        })
        .returning();

      // Process and store nutrient results
      const results = await processBloodTestNutrients(bloodTest.id, validatedData.nutrients);

      // Get user preferences for recommendations
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      // Get deficient nutrients for recommendations
      const deficientNutrients = results
        .filter(result => result.status !== 'normal')
        .map(result => result.nutrientName);

      // Generate recipe recommendations
      const recommendations = await generateRecipeRecommendations(deficientNutrients);

      res.json({
        status: 'success',
        data: {
          bloodTest,
          results,
          recommendations
        }
      });

    } catch (error) {
      console.error('Manual blood test entry error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid input data',
          errors: error.errors
        });
      }
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to process blood test results'
      });
    }
  });

  return createServer(app);
}
