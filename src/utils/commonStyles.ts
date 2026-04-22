/**
 * Common responsive class patterns used across the platform
 * Reduces duplication and ensures consistency
 */

export const containerClasses = "container mx-auto p-4 md:p-6 space-y-6";

export const pageHeaderClasses = "text-2xl md:text-3xl font-bold";

export const pageDescriptionClasses = "text-sm md:text-base text-muted-foreground";

export const loadingContainerClasses = "flex items-center justify-center min-h-[400px]";

export const gridColsResponsive = {
  two: "grid gap-4 grid-cols-1 md:grid-cols-2",
  three: "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  four: "grid gap-4 grid-cols-2 md:grid-cols-4",
  six: "grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

export const cardHeaderResponsive = "text-base md:text-lg";

export const buttonResponsive = "w-full sm:w-auto";

export const tableResponsive = "overflow-x-auto -mx-4 md:mx-0";

export const airbnbCard = "bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer";
