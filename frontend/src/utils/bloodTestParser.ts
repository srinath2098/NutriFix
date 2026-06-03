export interface ParsedNutrient {
  name: string;
  value: number;
  unit: string;
}

export function parseBloodTestText(text: string): ParsedNutrient[] {
  const nutrientPatterns = [
    // Common nutrient patterns
    /([\w\s]+):\s*(\d+(?:\.\d+)?)\s*([\w]+)/gi,
    /([\w\s]+)\s*(\d+(?:\.\d+)?)\s*([\w]+)/gi,
    /(\d+(?:\.\d+)?)\s*([\w]+)\s*([\w\s]+)/gi
  ];

  const parsedNutrients: ParsedNutrient[] = [];

  // Try all patterns
  for (const pattern of nutrientPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const [_, name, value, unit] = match;
      if (name && value && unit) {
        try {
          const parsedValue = parseFloat(value);
          if (!isNaN(parsedValue)) {
            parsedNutrients.push({
              name: name.trim(),
              value: parsedValue,
              unit: unit.trim()
            });
          }
        } catch (error) {
          console.error('Error parsing nutrient:', error);
        }
      }
    }
  }

  return parsedNutrients;
}
