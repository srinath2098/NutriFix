export type NutrientStatus = 'deficient' | 'insufficient' | 'normal' | 'excess';
export type NutrientSeverity = 'mild' | 'moderate' | 'severe';

export interface NutrientRange {
  min: number;
  max: number;
}

export interface NormalRange {
  min: number;
  max: number;
  unit: string;
  ranges: {
    deficient: NutrientRange;
    insufficient: NutrientRange;
    normal: NutrientRange;
    excess: NutrientRange;
  };
}

export interface NutrientAnalysis {
  status: NutrientStatus;
  severity: NutrientSeverity | null;
  minRange: number;
  maxRange: number;
}
