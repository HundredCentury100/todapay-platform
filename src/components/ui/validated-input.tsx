import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  touched?: boolean;
}

const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, label, error, touched, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const showError = error && touched;

    return (
      <div className="space-y-2">
        <Label 
          htmlFor={id}
          className={cn(
            "transition-colors duration-200",
            showError && "text-destructive"
          )}
        >
          {label}
        </Label>
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            className={cn(
              "transition-all duration-200",
              showError && "border-destructive focus-visible:ring-destructive pr-10",
              isFocused && showError && "animate-pulse",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={showError}
            aria-describedby={showError ? `${id}-error` : undefined}
            {...props}
          />
          {showError && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive animate-fade-in" />
          )}
        </div>
        {showError && (
          <p
            id={`${id}-error`}
            className="text-sm text-destructive animate-fade-in flex items-start gap-1"
            role="alert"
          >
            <span className="inline-block animate-scale-in">{error}</span>
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

export { ValidatedInput };
