import { type Request, type Response } from 'express';
import { manualBloodTestSchema } from '../validation/bloodTest';
import { processBloodTestNutrients } from '../utils/nutrientAnalysis';
import { generateRecipeRecommendations, type RecipeRecommendation } from '../mistral';
import { db } from '../db';
import { bloodTests, bloodTestResults, type BloodTest } from '@shared/schema';

interface OpenIDUser {
  sub: string;
  [key: string]: unknown;
}

interface RequestContext {
  user?: OpenIDUser;
}

export type AuthenticatedRequest = Request & {
  oidc: RequestContext;
};

export async function handleManualBloodTestEntry(req: Request, res: Response) {
  try {
    // Check authentication
    const userId = (req as AuthenticatedRequest).oidc?.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse and validate the request data
    const validationResult = manualBloodTestSchema.safeParse({
      ...req.body,
      userId
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validationResult.error.errors 
      });
    }

    const { testDate, nutrients } = validationResult.data;

    // Create blood test record
    const [bloodTest] = await db.insert(bloodTests)
      .values({
        userId,
        testDate: new Date(testDate),
        extractedText: 'Manual entry',
        fileName: 'manual-entry',
        source: 'manual',
        status: 'processed',
        confidence: 1.0,
        warnings: [],
        processedAt: new Date(),
        createdAt: new Date()
      })
      .returning();

    // Process and store nutrient values
    const results = await processBloodTestNutrients(bloodTest.id, nutrients.map(n => ({
      name: n.name,
      value: Number(n.value),
      unit: n.unit
    })));

    // Generate recipe recommendations based on deficiencies
    const deficientNutrients = results
      .filter(r => r.status === 'deficient')
      .map(r => r.nutrientName);

    let recommendations: RecipeRecommendation[] = [];
    if (deficientNutrients.length > 0) {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
        columns: {
          dietaryPreferences: true,
          allergies: true
        }
      });

      recommendations = await generateRecipeRecommendations(
        deficientNutrients,
        user?.dietaryPreferences as string[] || [],
        user?.allergies as string[] || []
      );
    }

    // Return the analysis results and recommendations
    res.json({
      testId: bloodTest.id,
      results,
      recommendations
    });

  } catch (error) {
    console.error('Blood test processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process blood test',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
