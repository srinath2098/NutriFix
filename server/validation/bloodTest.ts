import { z } from 'zod';
import { nutrientRanges } from '../utils/nutrientRanges';

// Helper to check if a nutrient value is within plausible ranges
function isPlausibleValue(value: number, nutrient: string): boolean {
  const range = nutrientRanges[nutrient as keyof typeof nutrientRanges];
  if (!range) return true; // If we don't have ranges, we can't validate

  // Allow values from 0 up to 3x the normal maximum
  const maxAllowed = range.ranges.normal.max * 3;
  return value >= 0 && value <= maxAllowed;
}

// Helper to validate nutrient unit
function validateUnit(unit: string, nutrient: string): boolean {
  const range = nutrientRanges[nutrient as keyof typeof nutrientRanges];
  if (!range) return true; // If we don't have ranges, accept any unit

  return range.unit.toLowerCase() === unit.toLowerCase();
}

export const manualNutrientSchema = z.object({
  name: z.string()
    .min(1, "Nutrient name is required")
    .transform(val => val.trim()),
  
  value: z.number()
    .positive("Value must be positive"),
  
  unit: z.string()
    .min(1, "Unit is required")
});

// Add custom refinements after defining the schema
export const manualBloodTestSchema = z.object({
  testDate: z.string()
    .datetime({ message: "Invalid date format" })
    .refine(date => new Date(date) <= new Date(), "Test date cannot be in the future"),
  
  nutrients: z.array(
    manualNutrientSchema.superRefine((data, ctx) => {
      // Validate value is plausible for the nutrient
      if (!isPlausibleValue(data.value, data.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Value seems unusually high for ${data.name}. Please verify the units and value.`,
          path: ['value']
        });
      }

      // Validate unit is correct for the nutrient
      if (!validateUnit(data.unit, data.name)) {
        const range = nutrientRanges[data.name as keyof typeof nutrientRanges];
        if (range) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Expected unit ${range.unit} for ${data.name}`,
            path: ['unit']
          });
        }
      }
    })
  )
  .min(1, "Add at least one nutrient")
  .refine(
    nutrients => {
      const names = nutrients.map(n => n.name.toLowerCase());
      const uniqueNames = new Set(names);
      return uniqueNames.size === names.length;
    },
    {
      message: "Duplicate nutrients are not allowed",
      path: ['nutrients']
    }
  )
});
