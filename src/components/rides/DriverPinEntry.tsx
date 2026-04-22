import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Phone, Check, X, AlertCircle, Shield, 
  Mic, Loader2, Hash
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DriverPinEntryProps {
  expectedPin: string;
  passengerName: string;
  onPinVerified: () => void;
  onCallPassenger?: () => void;
  className?: string;
}

export function DriverPinEntry({
  expectedPin,
  passengerName,
  onPinVerified,
  onCallPassenger,
  className,
}: DriverPinEntryProps) {
  const [enteredPin, setEnteredPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handlePinChange = (value: string) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setEnteredPin(cleaned);
    setError(null);
  };

  const handleVerify = async () => {
    if (enteredPin.length !== 4) {
      setError("Please enter 4 digits");
      return;
    }

    setIsVerifying(true);
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (enteredPin === expectedPin) {
      toast.success("PIN verified! Starting trip...");
      onPinVerified();
    } else {
      setAttempts(prev => prev + 1);
      setError("Incorrect PIN. Ask passenger for the correct code.");
      setEnteredPin("");
      
      if (attempts >= 2) {
        toast.error("Multiple incorrect attempts. Contact support if issues persist.");
      }
    }
    
    setIsVerifying(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && enteredPin.length === 4) {
      handleVerify();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-2xl bg-card border border-border shadow-lg",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Verify Passenger</p>
          <p className="text-xs text-muted-foreground">
            Ask {passengerName} for their 4-digit PIN
          </p>
        </div>
      </div>

      {/* PIN Input */}
      <div className="space-y-3">
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                "h-14 w-12 rounded-xl border-2 flex items-center justify-center",
                "text-2xl font-mono font-bold transition-all",
                enteredPin[index]
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-muted text-muted-foreground",
                error && "border-destructive"
              )}
            >
              {enteredPin[index] || '•'}
            </div>
          ))}
        </div>

        {/* Hidden input for keyboard */}
        <Input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={enteredPin}
          onChange={(e) => handlePinChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="sr-only"
          autoFocus
        />

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, index) => (
            <Button
              key={index}
              variant={num === 'del' ? 'outline' : 'ghost'}
              size="lg"
              className={cn(
                "h-14 text-xl font-semibold",
                num === null && "invisible"
              )}
              onClick={() => {
                if (num === 'del') {
                  setEnteredPin(prev => prev.slice(0, -1));
                } else if (typeof num === 'number') {
                  handlePinChange(enteredPin + num);
                }
              }}
              disabled={num === null}
            >
              {num === 'del' ? <X className="h-5 w-5" /> : num}
            </Button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Verify Button */}
        <Button
          className="w-full h-12"
          onClick={handleVerify}
          disabled={enteredPin.length !== 4 || isVerifying}
        >
          {isVerifying ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Verify PIN
            </>
          )}
        </Button>

        {/* Call Passenger */}
        {onCallPassenger && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onCallPassenger}
          >
            <Phone className="h-4 w-4" />
            Call {passengerName}
          </Button>
        )}

        {/* Attempts Warning */}
        {attempts > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            {3 - attempts} attempts remaining
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default DriverPinEntry;
