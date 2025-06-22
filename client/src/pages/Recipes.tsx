import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Clock, Star, Users } from "lucide-react";
import RecipeCard from "@/components/RecipeCard";

export default function Recipes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const { data: recipes = [] } = useQuery({
    queryKey: ["/api/recipes"],
  });

  const { data: deficiencies = [] } = useQuery({
    queryKey: ["/api/deficiencies"],
  });

  const { data: recommendedRecipes = [] } = useQuery({
    queryKey: ["/api/recipes/recommended"],
  });

  const filteredRecipes = recipes.filter((recipe: any) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === "recommended") {
      return matchesSearch && recommendedRecipes.some((r: any) => r.id === recipe.id);
    }
    
    if (selectedFilter && selectedFilter !== "all") {
      return matchesSearch && recipe.targetNutrients?.includes(selectedFilter);
    }
    
    return matchesSearch;
  });

  const availableNutrients = [...new Set(
    recipes.flatMap((recipe: any) => recipe.targetNutrients || [])
  )];

  const deficientNutrients = deficiencies.map((d: any) => d.nutrient.name.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Recipe Library</h1>
        <p className="text-lg text-gray-600">
          Discover recipes tailored to your nutritional needs
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedFilter === null ? "default" : "outline"}
                onClick={() => setSelectedFilter(null)}
                size="sm"
              >
                All Recipes
              </Button>
              
              <Button
                variant={selectedFilter === "recommended" ? "default" : "outline"}
                onClick={() => setSelectedFilter("recommended")}
                size="sm"
                className="bg-primary-600 hover:bg-primary-700"
              >
                Recommended
              </Button>

              {deficientNutrients.map((nutrient) => (
                <Button
                  key={nutrient}
                  variant={selectedFilter === nutrient ? "default" : "outline"}
                  onClick={() => setSelectedFilter(nutrient)}
                  size="sm"
                  className="capitalize"
                >
                  {nutrient}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Recipes Section */}
      {recommendedRecipes.length > 0 && !selectedFilter && !searchTerm && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
            <Button
              variant="outline"
              onClick={() => setSelectedFilter("recommended")}
            >
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {recommendedRecipes.slice(0, 3).map((recipe: any) => (
              <RecipeCard key={recipe.id} recipe={recipe} isRecommended />
            ))}
          </div>
        </div>
      )}

      {/* All Recipes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedFilter === "recommended" ? "Recommended Recipes" : 
             selectedFilter ? `Recipes for ${selectedFilter}` : 
             "All Recipes"}
          </h2>
          <p className="text-gray-600">
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredRecipes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recipes found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or filters to find recipes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe: any) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                isRecommended={recommendedRecipes.some((r: any) => r.id === recipe.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      {availableNutrients.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Browse by Nutrient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableNutrients.map((nutrient) => (
                <Badge
                  key={nutrient}
                  variant={selectedFilter === nutrient ? "default" : "secondary"}
                  className={`
                    cursor-pointer capitalize px-3 py-1
                    ${deficientNutrients.includes(nutrient.toLowerCase()) 
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                      : ''
                    }
                  `}
                  onClick={() => setSelectedFilter(selectedFilter === nutrient ? null : nutrient)}
                >
                  {nutrient}
                  {deficientNutrients.includes(nutrient.toLowerCase()) && " ⚠️"}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              ⚠️ Indicates nutrients you may be deficient in
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
