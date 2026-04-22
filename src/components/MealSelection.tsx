import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCurrency } from "@/contexts/CurrencyContext";
import { UtensilsCrossed, ChevronDown } from "lucide-react";
import { MealOption } from "@/types/enhancements";
import { cn } from "@/lib/utils";

const mealOptions: MealOption[] = [
  { id: 'breakfast', name: 'Breakfast Box', description: 'Croissant, fruit, yogurt, juice', price: 8, category: 'breakfast' },
  { id: 'lunch', name: 'Lunch Combo', description: 'Sandwich, chips, fruit, drink', price: 12, category: 'lunch' },
  { id: 'dinner', name: 'Dinner Pack', description: 'Hot meal with sides and dessert', price: 15, category: 'dinner' },
  { id: 'snack', name: 'Snack Pack', description: 'Chips, cookies, drink', price: 5, category: 'snack' },
];

interface MealSelectionProps {
  duration: string;
  onMealsChange: (meals: MealOption[], totalPrice: number) => void;
}

const MealSelection = ({ duration, onMealsChange }: MealSelectionProps) => {
  const { convertPrice } = useCurrency();
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const durationHours = parseInt(duration);
  const showMeals = durationHours >= 4;

  if (!showMeals) return null;

  const handleMealToggle = (mealId: string) => {
    const newSelected = selectedMeals.includes(mealId)
      ? selectedMeals.filter(id => id !== mealId)
      : [...selectedMeals, mealId];
    
    setSelectedMeals(newSelected);
    
    const meals = mealOptions.filter(m => newSelected.includes(m.id));
    const totalPrice = meals.reduce((sum, meal) => sum + meal.price, 0);
    onMealsChange(meals, totalPrice);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" />
              <h3 className="font-semibold">Pre-Order Meals</h3>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
              {selectedMeals.length > 0 && !isOpen && (
                <Badge variant="default" className="text-xs">{selectedMeals.length} meals</Badge>
              )}
            </div>
            <ChevronDown className={cn("w-5 h-5 transition-transform", isOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <p className="text-sm text-muted-foreground mb-4">
              Long journey ahead! Pre-order meals for a comfortable trip.
            </p>

      <div className="space-y-3">
        {mealOptions.map((meal) => (
          <div key={meal.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
            <Checkbox
              id={meal.id}
              checked={selectedMeals.includes(meal.id)}
              onCheckedChange={() => handleMealToggle(meal.id)}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Label htmlFor={meal.id} className="cursor-pointer font-medium">
                  {meal.name}
                </Label>
                <span className="font-semibold text-sm">{convertPrice(meal.price)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
            </div>
          </div>
        ))}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default MealSelection;
