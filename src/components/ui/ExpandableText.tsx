import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  className?: string;
  lines?: number;
}

export const ExpandableText = ({ text, className, lines = 6 }: ExpandableTextProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p
        className={cn(
          "text-muted-foreground leading-relaxed transition-all",
          !expanded && `line-clamp-${lines}`,
          className
        )}
        style={!expanded ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}
      >
        {text}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-sm font-semibold underline underline-offset-4 text-foreground hover:text-primary transition-colors"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
};
