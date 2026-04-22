import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "default" | "white";
}

const sizeMap = {
  xs: { container: "h-8 w-8 rounded-xl", svg: "w-5 h-5" },
  sm: { container: "h-11 w-11 rounded-2xl", svg: "w-7 h-7" },
  md: { container: "h-16 w-16 rounded-2xl", svg: "w-10 h-10" },
  lg: { container: "h-20 w-20 rounded-[1.75rem]", svg: "w-12 h-12" },
  xl: { container: "h-24 w-24 md:h-32 md:w-32 rounded-2xl", svg: "w-16 h-16 md:w-20 md:h-20" },
};

export const BrandLogo = ({ size = "sm", className, variant = "default" }: BrandLogoProps) => {
  const sizes = sizeMap[size];
  const isWhite = variant === "white";

  return (
    <div
      className={cn(
        "flex items-center justify-center shadow-2xl",
        isWhite
          ? "bg-white/10 border border-white/30"
          : "bg-primary shadow-primary/30",
        sizes.container,
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className={sizes.svg}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ticket shape */}
        <path
          d="M15 25 L85 25 L85 40 C80 40 75 45 75 50 C75 55 80 60 85 60 L85 75 L15 75 L15 60 C20 60 25 55 25 50 C25 45 20 40 15 40 Z"
          fill={isWhite ? "white" : "hsl(var(--primary-foreground))"}
        />
        {/* Decorative lines */}
        <line
          x1="35" y1="35" x2="65" y2="35"
          stroke={isWhite ? "hsl(var(--primary))" : "hsl(var(--primary))"}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="35" y1="45" x2="55" y2="45"
          stroke={isWhite ? "hsl(var(--primary))" : "hsl(var(--primary))"}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="35" y1="55" x2="60" y2="55"
          stroke={isWhite ? "hsl(var(--primary))" : "hsl(var(--primary))"}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="70" cy="60" r="8" fill={isWhite ? "hsl(var(--primary))" : "hsl(var(--primary))"} />
        <path
          d="M67 60 L69 62 L73 58"
          stroke={isWhite ? "white" : "hsl(var(--primary-foreground))"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
