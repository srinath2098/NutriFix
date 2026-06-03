import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { BloodTestResult, Nutrient } from "@shared/schema";

interface Props {
  deficiency: BloodTestResult & { nutrient: Nutrient };
}

export default function DeficiencyCard({ deficiency }: Props) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{deficiency.nutrient.name || "Nutrient"}</CardTitle>
        <Badge color="warning">{deficiency.status || "deficient"}</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500">
          <strong>Severity:</strong> {deficiency.severity || "N/A"}
        </div>
        <div className="text-sm text-gray-500">
          <strong>Value:</strong> {deficiency.value ?? "N/A"} {deficiency.nutrient?.unit || ""}
        </div>
      </CardContent>
    </Card>
  );
}
