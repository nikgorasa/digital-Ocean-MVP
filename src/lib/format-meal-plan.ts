export const MEAL_PLAN_MAP: Record<
  string,
  { label: string; description: string }
> = {
  Room_Only: { label: "Room Only", description: "No meals included" },
  Breakfast: { label: "Breakfast Included", description: "Daily breakfast" },
  Half_Board: { label: "Half Board", description: "Breakfast & Dinner" },
  Full_Board: {
    label: "Full Board",
    description: "Breakfast, Lunch & Dinner",
  },
  All_Inclusive: {
    label: "All Inclusive",
    description: "All meals, drinks & snacks",
  },
};

export function formatMealPlan(mealType: string): {
  label: string;
  description: string;
} {
  return (
    MEAL_PLAN_MAP[mealType] || {
      label: mealType.replace(/_/g, " "),
      description: "",
    }
  );
}
