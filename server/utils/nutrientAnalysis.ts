import { type ManualNutrientEntry } from '@shared/types';
import { bloodTestResults, nutrients, type BloodTestResult } from '@shared/schema';
import { db } from '../db';
import { analyzeNutrientValue } from './nutrientRanges';

export async function processBloodTestNutrients(
  bloodTestId: number, 
  nutrientEntries: Array<{ name: string; value: number; unit: string }>
): Promise<BloodTestResult[]> {
  const results: BloodTestResult[] = [];
  
  for (const entry of nutrientEntries) {
    // Get or create nutrient record
    let nutrient = await db.query.nutrients.findFirst({
      where: (nutrients, { eq }) => eq(nutrients.name, entry.name)
    });
    
    if (!nutrient) {
      const [newNutrient] = await db.insert(nutrients)
        .values({
          name: entry.name,
          unit: entry.unit,
          normalRangeMin: null,
          normalRangeMax: null,
          description: null
        })
        .returning();
      nutrient = newNutrient;
    }
    
    // Analyze the nutrient value
    const analysis = analyzeNutrientValue(entry.name, entry.value);
    
    // Store the result
    const [result] = await db.insert(bloodTestResults)
      .values({
        bloodTestId,
        nutrientName: entry.name,
        value: entry.value,
        unit: entry.unit,
        status: analysis.status,
        severity: analysis.severity,
        minRange: analysis.minRange,
        maxRange: analysis.maxRange,
        createdAt: new Date()
      })
      .returning();
    
    results.push(result);
  }
  
  return results;
}
