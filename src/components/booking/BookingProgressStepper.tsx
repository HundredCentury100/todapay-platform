import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Step {
  id: number;
  name: string;
  shortName?: string;
  status: 'complete' | 'current' | 'upcoming';
}

interface BookingProgressStepperProps {
  currentStep: number;
  steps?: string[];
  compact?: boolean;
}

const defaultSteps = [
  "Search",
  "Select",
  "Details",
  "Payment",
  "Done"
];

export const BookingProgressStepper = ({ 
  currentStep, 
  steps = defaultSteps,
  compact = false
}: BookingProgressStepperProps) => {
  const isMobile = useIsMobile();
  const showCompact = compact || isMobile;

  const formattedSteps: Step[] = steps.map((name, index) => ({
    id: index + 1,
    name,
    shortName: name.slice(0, 3),
    status: index + 1 < currentStep ? 'complete' : index + 1 === currentStep ? 'current' : 'upcoming'
  }));

  if (showCompact) {
    return (
      <nav aria-label="Progress" className="mb-4">
        <div className="flex items-center justify-center gap-2">
          {formattedSteps.map((step, stepIdx) => (
            <div key={step.name} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all",
                step.status === 'complete' && "bg-primary text-primary-foreground",
                step.status === 'current' && "border-2 border-primary bg-background text-primary",
                step.status === 'upcoming' && "border-2 border-muted bg-background text-muted-foreground"
              )}>
                {step.status === 'complete' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              {stepIdx < formattedSteps.length - 1 && (
                <div className={cn(
                  "w-6 h-0.5 transition-colors",
                  step.status === 'complete' ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-medium text-primary mt-2">
          {formattedSteps.find(s => s.status === 'current')?.name}
        </p>
      </nav>
    );
  }

  return (
    <nav aria-label="Progress" className="mb-6">
      <ol role="list" className="flex items-center justify-between">
        {formattedSteps.map((step, stepIdx) => (
          <li key={step.name} className={cn("relative", stepIdx !== formattedSteps.length - 1 ? "flex-1" : "")}>
            {step.status === 'complete' ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  {stepIdx !== formattedSteps.length - 1 && (
                    <div className="h-0.5 w-full bg-primary" />
                  )}
                </div>
                <div className="relative flex items-center justify-center">
                  <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                    <Check className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  </span>
                </div>
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-primary whitespace-nowrap">
                  {step.name}
                </span>
              </>
            ) : step.status === 'current' ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  {stepIdx !== formattedSteps.length - 1 && (
                    <div className="h-0.5 w-full bg-border" />
                  )}
                </div>
                <div className="relative flex items-center justify-center">
                  <span className="h-8 w-8 rounded-full border-2 border-primary flex items-center justify-center bg-background" aria-current="step">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>
                </div>
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-primary whitespace-nowrap">
                  {step.name}
                </span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  {stepIdx !== formattedSteps.length - 1 && (
                    <div className="h-0.5 w-full bg-border" />
                  )}
                </div>
                <div className="relative flex items-center justify-center">
                  <span className="h-8 w-8 rounded-full border-2 border-border flex items-center justify-center bg-background hover:border-primary/50 transition-colors">
                    <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                  </span>
                </div>
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                  {step.name}
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
