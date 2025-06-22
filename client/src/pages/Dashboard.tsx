import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Heart, TrendingUp, AlertTriangle, Target, Calendar, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import RecipeCard from "@/components/RecipeCard";
import DeficiencyCard from "@/components/DeficiencyCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DashboardCardSkeleton, RecipeCardSkeleton } from "@/components/Skeletons";
import { MealPlanCard } from "@/components/MealPlanCard";
import { BloodTest, BloodTestResult, Nutrient, Recipe, MealPlan, MealPlanEntry } from "@shared/schema";

// Define types for API responses that include nested data
type LatestBloodTestResponse = BloodTest & { bloodTestResults?: (BloodTestResult & { nutrient: Nutrient })[] };
type DeficienciesResponse = (BloodTestResult & { nutrient: Nutrient })[];
type RecommendedRecipesResponse = Recipe[];
type CurrentMealPlanResponse = MealPlan & { entries: (MealPlanEntry & { recipe?: Recipe })[] };

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: latestBloodTest, isLoading: isLoadingBloodTest } = useQuery<LatestBloodTestResponse>({
    queryKey: ["/api/bloodtest/latest"],
  });

  const { data: deficiencies = [], isLoading: isLoadingDeficiencies } = useQuery<DeficienciesResponse>({
    queryKey: ["/api/deficiencies"],
  });

  const { data: recommendedRecipes = [], isLoading: isLoadingRecipes } = useQuery<RecommendedRecipesResponse>({
    queryKey: ["/api/recipes/recommended"],
  });

  const { data: currentMealPlan, isLoading: isLoadingMealPlan } = useQuery<CurrentMealPlanResponse>({
    queryKey: ["/api/meal-plan/current"],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const calculateHealthScore = () => {
    // Use optional chaining and nullish coalescing for safety
    const results = latestBloodTest?.bloodTestResults ?? [];
    if (results.length === 0) return 85;

    const totalResults = results.length;
    const normalResults = results.filter((r) => r.status === 'normal').length;

    return Math.round((normalResults / totalResults) * 100);
  };

  const getCompletedMealsThisWeek = () => {
    const entries = currentMealPlan?.entries ?? [];
    if (entries.length === 0) return { completed: 0, total: 0 };

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const thisWeekEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate < weekEnd;
    });

    const completed = thisWeekEntries.filter((entry) => entry.completed).length;

    return { completed, total: thisWeekEntries.length };
  };

  const renderHealthStatusGrid = () => {
    if (isLoadingBloodTest || isLoadingDeficiencies) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Overall Health Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScore}</div>
            <Progress value={healthScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Based on your latest blood work
            </p>
          </CardContent>
        </Card>

        {/* Deficiencies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deficiencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{deficiencies.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {deficiencies.length > 0
                ? deficiencies.slice(0, 3).map((d) => d.nutrient.name).join(', ')
                : 'No deficiencies detected'}
            </p>
          </CardContent>
        </Card>

        {/* This Week's Meal Plan Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealProgress.completed} / {mealProgress.total}</div>
            <p className="text-xs text-muted-foreground mt-2">
              meals completed
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRecommendedRecipes = () => {
    if (isLoadingRecipes) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
        </div>
      );
    }

    if (recommendedRecipes.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No recipe recommendations yet.</p>
          <Button onClick={() => setLocation("/upload")} variant="outline" className="mt-4">
            Upload Blood Test
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendedRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    );
  };

  const healthScore = calculateHealthScore();
  const mealProgress = getCompletedMealsThisWeek();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              {getGreeting()}, {user?.firstName || 'there'}!
            </h2>
            <p className="text-gray-700">Let's check your nutrition progress today</p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-white/50 rounded-full shadow-sm backdrop-blur-sm">
            <Heart className="w-8 h-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Health Status Overview */}
      {renderHealthStatusGrid()}

      {/* Upload Section */}
      <Card className="mb-8">
        <CardContent className="pt-6 text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload New Blood Test</h3>
          <p className="text-gray-600 mb-4">
            Get updated recommendations based on your latest results
          </p>
          <Button onClick={() => setLocation('/upload')}>Upload Test</Button>
        </CardContent>
      </Card>

      {/* Latest Blood Test Results */}
      {latestBloodTest?.bloodTestResults && latestBloodTest.bloodTestResults.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Latest Blood Test Results</h3>
          <p className="text-gray-600 mb-4">
              Based on your latest blood test from {latestBloodTest.testDate ? new Date(latestBloodTest.testDate).toLocaleDateString() : 'N/A'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestBloodTest.bloodTestResults.map((result) => (
              <DeficiencyCard
                key={result.id}
                deficiency={result}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Recipes */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Recommended Recipes</h2>
        {renderRecommendedRecipes()}
      </section>

      {/* Current Meal Plan */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">This Week's Meal Plan</h2>
        <MealPlanCard mealPlan={currentMealPlan} isLoading={isLoadingMealPlan} />
      </section>
    </div>
  );
}
