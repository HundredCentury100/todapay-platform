import { LucideIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ProfileMenuItemProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  path?: string;
  onClick?: () => void;
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  iconColor?: string;
  showArrow?: boolean;
  danger?: boolean;
}

export function ProfileMenuItem({
  icon: Icon,
  label,
  description,
  path,
  onClick,
  badge,
  badgeVariant = "secondary",
  iconColor,
  showArrow = true,
  danger = false,
}: ProfileMenuItemProps) {
  const content = (
    <div 
      className={`flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 active:scale-[0.98] transition-all duration-200 cursor-pointer ${danger ? 'text-destructive' : ''}`}
      onClick={onClick}
    >
      <div className={`h-10 w-10 rounded-2xl ${danger ? 'bg-destructive/10' : 'bg-muted'} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
        <Icon className={`h-5 w-5 ${iconColor || (danger ? 'text-destructive' : 'text-muted-foreground')}`} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${danger ? 'text-destructive' : ''}`}>{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        )}
      </div>
      {badge !== undefined && (
        <Badge variant={badgeVariant}>{badge}</Badge>
      )}
      {showArrow && !danger && (
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );

  if (path) {
    return <Link to={path}>{content}</Link>;
  }

  return content;
}
