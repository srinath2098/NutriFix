import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AddRecipe() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [targetNutrients, setTargetNutrients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleIngredientChange = (idx: number, value: string) => {
    setIngredients(ingredients.map((ing, i) => (i === idx ? value : ing)));
  };

  const addIngredient = () => setIngredients([...ingredients, ""]);
  const removeIngredient = (idx: number) => setIngredients(ingredients.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("POST", "/api/recipes", {
        title,
        description,
        instructions,
        ingredients: ingredients.filter(Boolean).map((i) => ({ name: i, amount: "", unit: "" })),
        targetNutrients,
      });
      toast({ title: "Recipe Added!", description: "Your recipe has been saved." });
      setTitle(""); setDescription(""); setInstructions(""); setIngredients([""]); setTargetNutrients([]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Add a Recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
            <Textarea placeholder="Instructions" value={instructions} onChange={e => setInstructions(e.target.value)} required />
            <div>
              <label className="block font-medium mb-2">Ingredients</label>
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input value={ing} onChange={e => handleIngredientChange(idx, e.target.value)} required />
                  <Button type="button" variant="outline" onClick={() => removeIngredient(idx)} disabled={ingredients.length === 1}>Remove</Button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addIngredient}>Add Ingredient</Button>
            </div>
            <Input placeholder="Target Nutrients (comma separated)" value={targetNutrients.join(", ")} onChange={e => setTargetNutrients(e.target.value.split(",").map(s => s.trim()))} />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Add Recipe"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
