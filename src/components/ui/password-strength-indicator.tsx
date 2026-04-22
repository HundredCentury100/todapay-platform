import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: "One lowercase letter",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: "One number",
    test: (pwd) => /\d/.test(pwd),
  },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };

    const metRequirements = requirements.filter((req) => req.test(password)).length;
    const percentage = (metRequirements / requirements.length) * 100;

    if (percentage <= 25) {
      return { score: percentage, label: "Weak", color: "bg-destructive" };
    } else if (percentage <= 50) {
      return { score: percentage, label: "Fair", color: "bg-orange-500" };
    } else if (percentage <= 75) {
      return { score: percentage, label: "Good", color: "bg-yellow-500" };
    } else {
      return { score: percentage, label: "Strong", color: "bg-green-500" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength:</span>
          <span className={cn("font-medium", {
            "text-destructive": strength.score <= 25,
            "text-orange-500": strength.score > 25 && strength.score <= 50,
            "text-yellow-500": strength.score > 50 && strength.score <= 75,
            "text-green-500": strength.score > 75,
          })}>
            {strength.label}
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full transition-all duration-500 ease-out", strength.color)}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-all duration-200",
                isMet ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}
            >
              {isMet ? (
                <Check className="h-3 w-3 animate-scale-in" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
