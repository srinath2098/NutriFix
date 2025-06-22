import { 
  type NutrientStatus, 
  type NutrientSeverity,
  type NutrientAnalysis,
  type NormalRange
} from './types';

interface NutrientRanges {
  [key: string]: NormalRange;
}

export const nutrientRanges: NutrientRanges = {
  "Vitamin D": {
    min: 30,
    max: 100,
    unit: "ng/mL",
    ranges: {
      deficient: { min: 0, max: 20 },
      insufficient: { min: 21, max: 29 },
      normal: { min: 30, max: 100 },
      excess: { min: 101, max: Infinity }
    }
  },
  "Vitamin B12": {
    min: 200,
    max: 900,
    unit: "pg/mL",
    ranges: {
      deficient: { min: 0, max: 200 },
      insufficient: { min: 201, max: 300 },
      normal: { min: 301, max: 900 },
      excess: { min: 901, max: Infinity }
    }
  },
  "Iron": {
    min: 60,
    max: 170,
    unit: "µg/dL",
    ranges: {
      deficient: { min: 0, max: 60 },
      insufficient: { min: 61, max: 80 },
      normal: { min: 81, max: 170 },
      excess: { min: 171, max: Infinity }
    }
  },
  "Ferritin": {
    min: 20,
    max: 200,
    unit: "ng/mL",
    ranges: {
      deficient: { min: 0, max: 20 },
      insufficient: { min: 21, max: 30 },
      normal: { min: 31, max: 200 },
      excess: { min: 201, max: Infinity }
    }
  },
  "Calcium": {
    min: 8.5,
    max: 10.5,
    unit: "mg/dL",
    ranges: {
      deficient: { min: 0, max: 8.4 },
      insufficient: { min: 8.5, max: 8.9 },
      normal: { min: 9.0, max: 10.5 },
      excess: { min: 10.6, max: Infinity }
    }
  }
};

export function analyzeNutrientValue(name: string, value: number): NutrientAnalysis {
  const range = nutrientRanges[name];
  
  if (!range) {
    return {
      status: value > 0 ? 'normal' : 'deficient',
      severity: null,
      minRange: 0,
      maxRange: 100
    };
  }

  let status: NutrientStatus = 'normal';
  let severity: NutrientSeverity | null = null;

  if (value < range.ranges.deficient.max) {
    status = 'deficient';
    severity = value < range.ranges.deficient.max / 2 ? 'severe' : 
              value < range.ranges.deficient.max * 0.75 ? 'moderate' : 'mild';
  } else if (value < range.ranges.insufficient.max) {
    status = 'insufficient';
    severity = 'mild';
  } else if (value > range.ranges.excess.min) {
    status = 'excess';
    severity = value > range.ranges.excess.min * 2 ? 'severe' : 
              value > range.ranges.excess.min * 1.5 ? 'moderate' : 'mild';
  }

  return {
    status,
    severity,
    minRange: range.min,
    maxRange: range.max
  };
}
