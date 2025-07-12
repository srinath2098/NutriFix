import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Apple, 
  Fish, 
  Beef, 
  Milk, 
  Wheat, 
  Carrot,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  Users,
  ChefHat,
  Calendar
} from "lucide-react";
import { useLocation } from "wouter";

interface NutrientFood {
  name: string;
  category: string;
  servingSize: string;
  nutrientContent: number;
  unit: string;
  bioavailability: string;
  dietaryRestrictions: string[];
  cookingTips?: string;
  otherNutrients?: string[];
}

interface NutrientInfo {
  name: string;
  description: string;
  deficiencySymptoms: string[];
  recommendedDailyIntake: { amount: number; unit: string };
  absorptionTips: string[];
  foods: NutrientFood[];
}

interface DeficiencyData {
  nutrientName: string;
  value: number;
  unit: string;
  status: string;
  severity: string | null;
  minRange: number;
  maxRange: number;
}

export default function FoodRecommendations() {
  const [, setLocation] = useLocation();

  // Use test deficiencies for demo purposes when no real deficiencies exist
  const { data: realDeficiencies = [] } = useQuery<DeficiencyData[]>({
    queryKey: ["/api/deficiencies"],
  });

  const { data: testDeficiencies = [], isLoading } = useQuery<DeficiencyData[]>({
    queryKey: ["/api/test-deficiencies"],
    enabled: realDeficiencies.length === 0, // Only use test data if no real deficiencies
  });

  const deficiencies = realDeficiencies.length > 0 ? realDeficiencies : testDeficiencies;

  const { data: nutritionInfo } = useQuery<{[key: string]: NutrientInfo}>({
    queryKey: ["/api/nutrition-info"],
  });

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fish': case 'seafood': return <Fish className="w-4 h-4" />;
      case 'meat': return <Beef className="w-4 h-4" />;
      case 'dairy': case 'dairy/eggs': return <Milk className="w-4 h-4" />;
      case 'grains': return <Wheat className="w-4 h-4" />;
      case 'vegetables': return <Carrot className="w-4 h-4" />;
      case 'fruits': return <Apple className="w-4 h-4" />;
      default: return <Apple className="w-4 h-4" />;
    }
  };

  const getBioavailabilityColor = (bioavailability: string) => {
    switch (bioavailability.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!deficiencies || deficiencies.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">All Nutrients Normal!</h2>
            <p className="text-gray-600 mb-6">
              Your blood test shows no significant nutrient deficiencies. Keep up the great work with your nutrition!
            </p>
            <div className="space-x-4">
              <Button onClick={() => setLocation('/blood-test-results')}>
                View Test Results
              </Button>
              <Button variant="outline" onClick={() => setLocation('/recipes')}>
                Browse Recipes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Food Recommendations</h1>
          <p className="text-gray-600 mt-2">
            Foods and recipes to address your nutrient deficiencies
          </p>
        </div>
        <Button onClick={() => setLocation('/recipes')} className="flex items-center">
          <ChefHat className="w-4 h-4 mr-2" />
          View Recipes
        </Button>
      </div>

      {/* Deficiencies Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{deficiencies.length}</p>
                <p className="text-sm text-gray-600">Nutrients to Address</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Apple className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">{deficiencies.length * 5}</p>
                <p className="text-sm text-gray-600">Food Options</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-600">2-4</p>
                <p className="text-sm text-gray-600">Weeks to Improve</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Nutrient Recommendations */}
      <div className="space-y-8">
        {deficiencies.map((deficiency) => {
          const nutrientData = nutritionInfo?.[deficiency.nutrientName];
          
          return (
            <Card key={deficiency.nutrientName} className="border-l-4 border-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                      {deficiency.nutrientName} Deficiency
                    </CardTitle>
                    <p className="text-gray-600 mt-1">
                      Current: {deficiency.value} {deficiency.unit} | 
                      Normal: {deficiency.minRange}-{deficiency.maxRange} {deficiency.unit}
                    </p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">
                    {deficiency.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="foods" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="foods">Best Foods</TabsTrigger>
                    <TabsTrigger value="symptoms">Why It Matters</TabsTrigger>
                    <TabsTrigger value="tips">Absorption Tips</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="foods" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {nutrientData?.foods?.slice(0, 6).map((food, index) => (
                        <Card key={index} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                {getCategoryIcon(food.category)}
                                <span className="ml-2 font-medium">{food.name}</span>
                              </div>
                              <Badge className={getBioavailabilityColor(food.bioavailability)}>
                                {food.bioavailability}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Per serving:</span>
                                <span className="font-medium">{food.servingSize}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Nutrient content:</span>
                                <span className="font-medium text-green-600">
                                  {food.nutrientContent} {food.unit}
                                </span>
                              </div>
                              {food.cookingTips && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-gray-500">
                                    💡 {food.cookingTips}
                                  </p>
                                </div>
                              )}
                              {food.otherNutrients && (
                                <div className="flex flex-wrap gap-1 pt-2">
                                  {food.otherNutrients.slice(0, 3).map((nutrient, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {nutrient}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )) || (
                        <p className="text-gray-500 col-span-3 text-center py-8">
                          Loading food recommendations...
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="symptoms" className="mt-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Signs of {deficiency.nutrientName} Deficiency:</h4>
                      <ul className="list-disc list-inside space-y-1 text-red-700">
                        {nutrientData?.deficiencySymptoms?.map((symptom, index) => (
                          <li key={index}>{symptom}</li>
                        )) || (
                          <li>Fatigue and general weakness</li>
                        )}
                      </ul>
                    </div>
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Daily Recommendation:</h4>
                      <p className="text-blue-700">
                        {nutrientData?.recommendedDailyIntake?.amount || 'Varies'} {nutrientData?.recommendedDailyIntake?.unit || deficiency.unit} per day
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tips" className="mt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">Maximize Absorption:</h4>
                      <ul className="list-disc list-inside space-y-1 text-green-700">
                        {nutrientData?.absorptionTips?.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        )) || (
                          <li>Take with meals for better absorption</li>
                        )}
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Section */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Start Cooking?</h3>
          <p className="text-gray-600 mb-4">
            Get personalized recipes that incorporate these nutrient-rich foods into delicious meals.
          </p>
          <div className="space-x-4">
            <Button onClick={() => setLocation('/recipes')} className="flex items-center">
              <ChefHat className="w-4 h-4 mr-2" />
              View Recommended Recipes
            </Button>
            <Button variant="outline" onClick={() => setLocation('/meal-plan')}>
              <Calendar className="w-4 h-4 mr-2" />
              Generate Meal Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
