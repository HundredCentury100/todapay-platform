import { cn } from "@/lib/utils";

interface ComingSoonBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export const ComingSoonBadge = ({ className, size = "sm" }: ComingSoonBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        className
      )}
    >
      Soon
    </span>
  );
};
