import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChefHat, Loader2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Deficiency {
  nutrientName: string;
  value: number;
  unit: string;
  status: string;
  severity: string | null;
}

interface GenerateRecipesButtonProps {
  deficiencies: Deficiency[];
}

export default function GenerateRecipesButton({ deficiencies }: GenerateRecipesButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateRecipesMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await apiRequest("POST", "/api/recipes/generate", {
        data: {
          deficiencies: deficiencies.map(d => d.nutrientName)
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/recommended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Recipes Generated! 🍳",
        description: `Created ${data.recipes?.length || 3} personalized recipes for your nutrient needs.`,
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error("Recipe generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate recipes. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (deficiencies.length === 0) {
    return null;
  }

  return (
    <Button
      onClick={() => generateRecipesMutation.mutate()}
      disabled={isGenerating}
      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium px-6 py-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate AI Recipes
        </>
      )}
    </Button>
  );
}
