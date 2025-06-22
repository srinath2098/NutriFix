import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { MealPlanEntry } from "@shared/schema";

interface DayData {
  date: Date;
  name: string;
  shortDate: string;
  entries: Array<MealPlanEntry & { recipe?: { id: number; title: string } }>;
}

interface Props {
  day: DayData;
  onToggleMealComplete?: (entryId: number, completed: boolean) => void;
}

export default function MealPlanDay({ day, onToggleMealComplete }: Props) {
  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>{day.name || day.date?.toLocaleDateString?.() || "Day"}</CardTitle>
        <div className="text-sm text-gray-500">{day.shortDate || ""}</div>
      </CardHeader>
      <CardContent>
        {(day.entries || []).map((entry: any) => (
          <div key={entry.id} className="flex items-center justify-between mb-2">
            <div>
              <span className="font-medium">{entry.mealType || "Meal"}</span>: {entry.recipe?.title || entry.customMeal || "N/A"}
            </div>
            {onToggleMealComplete && (
              <Button size="sm" variant={entry.completed ? "default" : "outline"} onClick={() => onToggleMealComplete(entry.id, !entry.completed)}>
                {entry.completed ? "✓" : "Mark Complete"}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
