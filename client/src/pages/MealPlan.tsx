import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BloodTestResult, Nutrient, MealPlan as MealPlanType, MealPlanEntry } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, RefreshCw, CheckCircle, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MealPlanDay from "@/components/MealPlanDay";

export default function MealPlan() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentMealPlan, isLoading } = useQuery<MealPlanType & { entries: MealPlanEntry[] }>({
    queryKey: ["/api/meal-plan/current"],
  });

  const { data: deficiencies = [] } = useQuery<(BloodTestResult & { nutrient: Nutrient })[]>({
    queryKey: ["/api/deficiencies"],
  });

  const generateMealPlanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/meal-plans/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans/current"] });
      toast({
        title: "Meal Plan Generated!",
        description: "Your new weekly meal plan is ready.",
      });
      setIsGenerating(false);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const completeMealMutation = useMutation({
    mutationFn: async ({ entryId, completed }: { entryId: number; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/meal-plans/entries/${entryId}/complete`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans/current"] });
    },
  });

  const handleGenerateMealPlan = async () => {
    if (deficiencies.length === 0) {
      toast({
        title: "No Deficiencies Found",
        description: "Upload a blood test first to get personalized meal plans.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateMealPlanMutation.mutate();
  };

  const handleToggleMealComplete = (entryId: number, completed: boolean) => {
    completeMealMutation.mutate({ entryId, completed });
  };

  const generateGroceryList = () => {
    if (!currentMealPlan?.entries) return;

    const ingredients = new Map<string, { amount: string; unit: string }>();
    
    currentMealPlan.entries.forEach((entry: any) => {
      if (entry.recipe?.ingredients) {
        entry.recipe.ingredients.forEach((ingredient: any) => {
          const key = ingredient.name.toLowerCase();
          if (ingredients.has(key)) {
            // Simple aggregation - in a real app, you'd want more sophisticated unit conversion
            const existing = ingredients.get(key)!;
            ingredients.set(key, {
              amount: `${existing.amount} + ${ingredient.amount}`,
              unit: ingredient.unit,
            });
          } else {
            ingredients.set(key, {
              amount: ingredient.amount,
              unit: ingredient.unit,
            });
          }
        });
      }
    });

    const groceryText = Array.from(ingredients.entries())
      .map(([name, { amount, unit }]) => `• ${amount} ${unit} ${name}`)
      .join('\n');

    const blob = new Blob([groceryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery-list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Grocery List Downloaded",
      description: "Your shopping list has been saved as a text file.",
    });
  };

  const getWeeklyProgress = () => {
    if (!currentMealPlan?.entries) return { completed: 0, total: 0 };
    
    const completed = currentMealPlan.entries.filter((entry: any) => entry.completed).length;
    const total = currentMealPlan.entries.length;
    
    return { completed, total };
  };

  const getWeekDays = () => {
    if (!currentMealPlan?.entries) return [];

    const weekStart = new Date(currentMealPlan.weekStartDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const dayEntries = currentMealPlan.entries.filter((entry: any) => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === date.toDateString();
      });

      days.push({
        date,
        name: date.toLocaleDateString('en-US', { weekday: 'long' }),
        shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        entries: dayEntries,
      });
    }
    
    return days;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          <p className="text-gray-600">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  const progress = getWeeklyProgress();
  const weekDays = getWeekDays();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Weekly Meal Plan</h1>
        <p className="text-lg text-gray-600">
          Personalized meals to address your nutritional needs
        </p>
      </div>

      {!currentMealPlan ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Meal Plan</h3>
            <p className="text-gray-600 mb-6">
              Generate a personalized meal plan based on your blood test results.
            </p>
            
            {deficiencies.length === 0 ? (
              <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                <p className="text-amber-800">
                  Upload a blood test first to get personalized meal recommendations.
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <p className="text-green-800">
                  Ready to generate a meal plan addressing your {deficiencies.length} deficienc{deficiencies.length === 1 ? 'y' : 'ies'}.
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleGenerateMealPlan}
              disabled={isGenerating || deficiencies.length === 0}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Generate Meal Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Meal Plan Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Meal Plan</CardTitle>
                  <p className="text-muted-foreground">
                    {new Date(currentMealPlan.weekStartDate).toLocaleDateString()} - {
                      new Date(new Date(currentMealPlan.weekStartDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={generateGroceryList}
                    disabled={!currentMealPlan.entries || currentMealPlan.entries.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Grocery List
                  </Button>
                  <Button
                    onClick={handleGenerateMealPlan}
                    disabled={isGenerating}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <span>Progress this week</span>
                    <span>{progress.completed}/{progress.total} meals</span>
                  </div>
                  <Progress value={(progress.completed / progress.total) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Calendar */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                {weekDays.map((day) => (
                  <MealPlanDay
                    key={day.date.toISOString()}
                    day={day}
                    onToggleMealComplete={handleToggleMealComplete}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Targeting Deficiencies */}
          {deficiencies.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Targeting Your Deficiencies</CardTitle>
                <p className="text-muted-foreground">
                  This meal plan is designed to address these nutrient deficiencies:
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {deficiencies.map((deficiency: any) => (
                    <Badge
                      key={deficiency.id}
                      variant="secondary"
                      className="bg-amber-100 text-amber-800"
                    >
                      {deficiency.nutrient.name}
                      <span className="ml-1 text-xs">({deficiency.severity})</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
