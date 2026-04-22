import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumTabsProps {
  tabs: { value: string; label: string; count?: number }[];
  activeTab?: string;
  defaultValue?: string;
  onTabChange?: (value: string) => void;
  className?: string;
  children?: ReactNode;
}

export function PremiumTabs({ 
  tabs, 
  activeTab: controlledActiveTab, 
  defaultValue,
  onTabChange, 
  className,
  children,
}: PremiumTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue || tabs[0]?.value || "");
  
  const activeTab = controlledActiveTab ?? internalActiveTab;
  
  const handleTabChange = (value: string) => {
    if (!controlledActiveTab) {
      setInternalActiveTab(value);
    }
    onTabChange?.(value);
  };

  return (
    <div className="space-y-4">
      <div className={cn("flex bg-secondary/50 p-1.5 rounded-2xl overflow-x-auto", className)}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap hover:bg-secondary/60 active:scale-[0.97]",
              activeTab === tab.value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activeTab === tab.value && (
              <motion.div
                layoutId="premiumActiveTab"
                className="absolute inset-0 bg-card rounded-xl shadow-sm"
                transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "relative z-10 px-2 py-0.5 text-xs rounded-full",
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {children && (
        <div>
          {/* Pass activeTab to children via cloning */}
          {Array.isArray(children) 
            ? children.map((child: any) => 
                child?.props?.value ? { ...child, props: { ...child.props, activeValue: activeTab } } : child
              )
            : children
          }
        </div>
      )}
    </div>
  );
}

interface PremiumTabContentProps {
  children: ReactNode;
  value: string;
  activeValue?: string;
}

export function PremiumTabContent({ children, value, activeValue }: PremiumTabContentProps) {
  // If activeValue is not passed, just render the content
  if (activeValue === undefined) {
    return <>{children}</>;
  }
  
  return (
    <AnimatePresence mode="wait">
      {value === activeValue && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
