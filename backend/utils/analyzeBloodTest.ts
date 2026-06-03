import { NutrientStatus, NutrientSeverity, analyzeNutrientValue } from './nutrientRanges';
import { bloodTestResults, nutrients } from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

interface NutrientResult {
  bloodTestId: number;
  nutrientName: string;
  value: number;
  unit: string;
  status: string;
  severity: string | null;
  minRange: number;
  maxRange: number;
  createdAt: Date;
}

export async function analyzeAndStoreBloodTest(bloodTestId: number, nutrientData: Array<{ name: string; value: number; unit: string }>) {
  const results: NutrientResult[] = [];
  
  for (const entry of nutrientData) {
    // Find or create nutrient
    const nutrient = await db.query.nutrients.findFirst({
      where: (nutrients, { eq }) => eq(nutrients.name, entry.name)
    });
    
    if (!nutrient) {
      // Create new nutrient if it doesn't exist
      const [newNutrient] = await db.insert(nutrients).values({
        name: entry.name,
        unit: entry.unit
      }).returning();
      
      const analysis = analyzeNutrientValue(entry.name, entry.value);
      results.push({
        bloodTestId,
        nutrientName: entry.name,
        value: entry.value,
        unit: entry.unit,
        status: analysis.status,
        severity: analysis.severity,
        minRange: analysis.minRange,
        maxRange: analysis.maxRange,
        createdAt: new Date(),
      });
    } else {
      const analysis = analyzeNutrientValue(entry.name, entry.value);
      results.push({
        bloodTestId,
        nutrientName: entry.name,
        value: entry.value,
        unit: entry.unit,
        status: analysis.status,
        severity: analysis.severity,
        minRange: analysis.minRange,
        maxRange: analysis.maxRange,
        createdAt: new Date(),
      });
    }
  }

  // Store all results
  await db.insert(bloodTestResults).values(results);
  
  return results;
}
