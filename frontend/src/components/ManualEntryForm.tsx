import { useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Minus, Lightbulb } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { manualBloodTestSchema } from "@shared/types";

type FormData = z.infer<typeof manualBloodTestSchema>;

const commonNutrients = [
  { name: "Vitamin D", unit: "ng/mL", typical: "30-100 ng/mL" },
  { name: "Vitamin B12", unit: "pg/mL", typical: "200-900 pg/mL" },
  { name: "Iron", unit: "µg/dL", typical: "60-170 µg/dL" },
  { name: "Ferritin", unit: "ng/mL", typical: "20-200 ng/mL" },
  { name: "Calcium", unit: "mg/dL", typical: "8.5-10.5 mg/dL" },
];

interface ManualEntryFormProps {
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export default function ManualEntryForm({ onSubmit, isLoading }: ManualEntryFormProps) {
  const [showPresets, setShowPresets] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(manualBloodTestSchema),
    defaultValues: {
      testDate: new Date().toISOString(),
      nutrients: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nutrients",
  });

  const handlePresetSelect = (nutrient: typeof commonNutrients[0]) => {
    // Don't add if already exists
    if (fields.some((field) => field.name.toLowerCase() === nutrient.name.toLowerCase())) {
      return;
    }

    append({
      name: nutrient.name,
      value: 0,
      unit: nutrient.unit,
    });
  };

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="testDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value?.split('T')[0]}
                  onChange={e => field.onChange(new Date(e.target.value).toISOString())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nutrient Presets */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm text-muted-foreground">Quick add common nutrients</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {commonNutrients.map((nutrient) => (
              <Button
                key={nutrient.name}
                type="button"
                variant={fields.some(f => f.name === nutrient.name) ? "secondary" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect(nutrient)}
                disabled={fields.some(f => f.name === nutrient.name)}
              >
                {nutrient.name}
              </Button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`nutrients.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nutrient Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`nutrients.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`nutrients.${index}.unit`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {commonNutrients.find(n => n.name === field.name)?.typical && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Typical range: {commonNutrients.find(n => n.name === field.name)?.typical}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => remove(index)}
              >
                <Minus className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ name: "", value: 0, unit: "" })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Nutrient
          </Button>
        </div>

        <Button type="submit" disabled={isLoading || fields.length === 0}>
          {isLoading ? "Saving..." : "Save Blood Test Results"}
        </Button>
      </form>
    </Form>
  );
}
