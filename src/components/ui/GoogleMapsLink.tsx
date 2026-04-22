import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleMapsLinkProps {
  address: string;
  lat?: number;
  lng?: number;
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const GoogleMapsLink = ({ 
  address, 
  lat, 
  lng, 
  className,
  showIcon = true,
  children 
}: GoogleMapsLinkProps) => {
  if (!address) return null;

  const url = lat && lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-primary hover:text-primary/80 hover:underline transition-colors tap-target",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children || address}
      {showIcon && <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />}
    </a>
  );
};
