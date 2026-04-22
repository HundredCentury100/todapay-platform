import { LucideIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  description?: string;
  path?: string;
  onClick?: () => void;
  iconColor?: string;
  iconBg?: string;
  badge?: string | number;
  danger?: boolean;
}

interface ProfileMenuSectionProps {
  title?: string;
  items: MenuItem[];
}

export function ProfileMenuSection({ title, items }: ProfileMenuSectionProps) {
  return (
    <div className="bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm">
      {title && (
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}
      <div className="divide-y divide-border/50">
        {items.map((item, index) => {
          const Icon = item.icon;
          const content = (
            <div
              key={index}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer ${
                item.danger ? 'text-destructive' : ''
              }`}
              onClick={item.onClick}
            >
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  item.iconBg || (item.danger ? 'bg-destructive/10' : 'bg-muted')
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    item.iconColor || (item.danger ? 'text-destructive' : 'text-foreground')
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${item.danger ? 'text-destructive' : ''}`}>
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {item.description}
                  </p>
                )}
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {item.badge}
                </span>
              )}
              {!item.danger && (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          );

          if (item.path) {
            return (
              <Link key={index} to={item.path}>
                {content}
              </Link>
            );
          }

          return <div key={index}>{content}</div>;
        })}
      </div>
    </div>
  );
}
