import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PickupPinDisplayProps {
  pin: string;
  driverName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PickupPinDisplay({
  pin,
  driverName,
  className,
  size = 'md',
}: PickupPinDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      toast.success("PIN copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy PIN");
    }
  };

  const sizeClasses = {
    sm: {
      container: "p-3",
      digit: "h-10 w-8 text-lg",
      title: "text-xs",
    },
    md: {
      container: "p-4",
      digit: "h-14 w-12 text-2xl",
      title: "text-sm",
    },
    lg: {
      container: "p-6",
      digit: "h-16 w-14 text-3xl",
      title: "text-base",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
        "border-2 border-primary/20",
        sizes.container,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className={cn("font-semibold text-foreground", sizes.title)}>
              Your Pickup PIN
            </p>
            <p className="text-xs text-muted-foreground">
              Share this with {driverName || 'your driver'}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsHidden(!isHidden)}
        >
          {isHidden ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* PIN Display */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {pin.split('').map((digit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "rounded-xl bg-background border-2 border-primary/30",
              "flex items-center justify-center font-mono font-bold",
              "shadow-lg shadow-primary/10",
              sizes.digit
            )}
          >
            {isHidden ? (
              <span className="text-primary">•</span>
            ) : (
              <span className="text-primary">{digit}</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Copy Button */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span>Copy PIN</span>
          </>
        )}
      </Button>

      {/* Instructions */}
      <p className="text-xs text-center text-muted-foreground mt-3">
        Driver must enter this PIN to start your trip
      </p>
    </motion.div>
  );
}

export default PickupPinDisplay;
