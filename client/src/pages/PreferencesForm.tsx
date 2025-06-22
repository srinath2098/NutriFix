import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Pescatarian", "Gluten-Free", "Dairy-Free", "None"];
const ALLERGY_OPTIONS = ["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Soy", "Wheat", "Fish", "Shellfish"];
const GOAL_OPTIONS = ["Weight Loss", "Muscle Gain", "General Health", "Energy", "Immunity"];

export default function PreferencesForm() {
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("PATCH", "/api/user/preferences", {
        dietaryPreferences,
        allergies,
        healthGoals,
      });
      toast({
        title: "Preferences Saved!",
        description: "Your dietary preferences have been updated.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  function toggleValue(arr: string[], value: string, setArr: (a: string[]) => void) {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Set Your Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-medium mb-2">Dietary Preferences</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(opt => (
                  <Button
                    key={opt}
                    type="button"
                    variant={dietaryPreferences.includes(opt) ? "default" : "outline"}
                    onClick={() => toggleValue(dietaryPreferences, opt, setDietaryPreferences)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-medium mb-2">Allergies</label>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map(opt => (
                  <Button
                    key={opt}
                    type="button"
                    variant={allergies.includes(opt) ? "default" : "outline"}
                    onClick={() => toggleValue(allergies, opt, setAllergies)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-medium mb-2">Health Goals</label>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map(opt => (
                  <Button
                    key={opt}
                    type="button"
                    variant={healthGoals.includes(opt) ? "default" : "outline"}
                    onClick={() => toggleValue(healthGoals, opt, setHealthGoals)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
