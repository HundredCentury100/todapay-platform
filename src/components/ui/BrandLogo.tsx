import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "default" | "white";
}

const sizeMap = {
  xs: { size: "h-8 w-8" },
  sm: { size: "h-11 w-11" },
  md: { size: "h-16 w-16" },
  lg: { size: "h-20 w-20" },
  xl: { size: "h-24 w-24 md:h-32 md:w-32" },
};

export const BrandLogo = ({ size = "sm", className }: BrandLogoProps) => {
  const sizes = sizeMap[size];

  return (
    <img
      src="/logoTodaPay.png"
      alt="TodaPay"
      className={cn(sizes.size, "object-contain", className)}
    />
  );
};
