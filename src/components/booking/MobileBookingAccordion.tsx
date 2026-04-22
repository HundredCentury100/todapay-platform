import { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { LucideIcon, User, Package, CreditCard, Accessibility, Users } from "lucide-react";

interface AccordionSectionProps {
  value: string;
  title: string;
  icon?: LucideIcon;
  description?: string;
  children: ReactNode;
  badge?: string;
  completed?: boolean;
}

export const AccordionSection = ({
  value,
  title,
  icon: Icon,
  description,
  children,
  badge,
  completed,
}: AccordionSectionProps) => (
  <AccordionItem value={value} className="border rounded-xl px-4 mb-2 bg-card">
    <AccordionTrigger className="hover:no-underline py-3">
      <div className="flex items-center gap-3 text-left">
        {Icon && (
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            completed ? "bg-green-500/20 text-green-600" : "bg-primary/10 text-primary"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{title}</span>
            {badge && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
            {completed && (
              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">
                ✓ Done
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </AccordionTrigger>
    <AccordionContent className="pb-4 pt-2">
      {children}
    </AccordionContent>
  </AccordionItem>
);

interface MobileBookingAccordionProps {
  defaultValue?: string[];
  children: ReactNode;
  className?: string;
}

export const MobileBookingAccordion = ({
  defaultValue = ["details"],
  children,
  className,
}: MobileBookingAccordionProps) => (
  <Accordion
    type="multiple"
    defaultValue={defaultValue}
    className={cn("space-y-0", className)}
  >
    {children}
  </Accordion>
);

// Pre-configured section icons for consistency
export const BookingSectionIcons = {
  details: User,
  extras: Package,
  payment: CreditCard,
  accessibility: Accessibility,
  passengers: Users,
} as const;
