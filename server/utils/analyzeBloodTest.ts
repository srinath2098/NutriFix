import { type NutrientStatus, type NutrientSeverity } from './types';
import { bloodTestResults, nutrients } from '@shared/schema';
import { db } from '../db';
import { analyzeNutrientValue } from './nutrientRanges';
import type { BloodTestResult } from '@shared/schema';

interface NutrientAnalysis {
  status: NutrientStatus;
  severity: NutrientSeverity | null;
  minRange: number;
  maxRange: number;
}

export async function analyzeAndStoreBloodTest(bloodTestId: number, nutrientData: Array<{ name: string; value: number; unit: string }>) {
  const results: Omit<BloodTestResult, 'id' | 'createdAt'>[] = [];
  
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
        severity: analysis.severity || 'normal',
        minRange: analysis.minRange,
        maxRange: analysis.maxRange
      });
    } else {
      const analysis = analyzeNutrientValue(entry.name, entry.value);
      results.push({
        bloodTestId,
        nutrientName: entry.name,
        value: entry.value,
        unit: entry.unit,
        status: analysis.status,
        severity: analysis.severity || 'normal',
        minRange: analysis.minRange,
        maxRange: analysis.maxRange
      });
    }
  }

  // Store all results
  await db.insert(bloodTestResults).values(results);
  
  return results;
}
