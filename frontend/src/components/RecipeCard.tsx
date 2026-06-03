import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Recipe } from "@shared/schema";

interface Props {
  recipe: Recipe;
  isRecommended?: boolean;
}

export default function RecipeCard({ recipe, isRecommended }: Props) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{recipe.title}</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {(recipe.targetNutrients || []).map((nutrient: string) => (
            <Badge key={nutrient}>{nutrient}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-2">{recipe.description}</p>
        <div className="text-sm text-gray-500 mb-2">
          <strong>Ingredients:</strong> {Array.isArray(recipe.ingredients) ? recipe.ingredients.map((i: any) => i.name).join(", ") : "N/A"}
        </div>
        <div className="text-sm text-gray-500">
          <strong>Instructions:</strong> {recipe.instructions}
        </div>
      </CardContent>
    </Card>
  );
}
