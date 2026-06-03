import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MealPlan } from "@shared/schema";
import { useLocation } from "wouter";

interface Props {
  mealPlan?: MealPlan;
  isLoading?: boolean;
}

export function MealPlanCard({ mealPlan, isLoading }: Props) {
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mealPlan) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <CardTitle className="mb-2">No Active Meal Plan</CardTitle>
          <p className="text-muted-foreground mb-4">
            Create a personalized meal plan based on your nutritional needs
          </p>
          <Button onClick={() => setLocation("/meal-plan")} variant="outline">
            Create Meal Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Display meal plan info here */}
          <p className="text-sm text-muted-foreground">
            Started on {new Date(mealPlan.weekStartDate).toLocaleDateString()}
          </p>
          <Button onClick={() => setLocation("/meal-plan")} variant="outline">
            View Full Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
