import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Gift, Check } from "lucide-react";
import { applyReferralCode } from "@/services/referralService";
import { toast } from "sonner";

interface ApplyReferralCodeProps {
  onSuccess?: () => void;
}

export function ApplyReferralCode({ onSuccess }: ApplyReferralCodeProps) {
  const [code, setCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError("Please enter a referral code");
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const result = await applyReferralCode(code);
      
      if (result.success) {
        setApplied(true);
        toast.success("Referral code applied! You'll receive $25 after your first booking.");
        onSuccess?.();
      } else {
        setError(result.error || "Invalid referral code");
      }
    } catch (err) {
      setError("Failed to apply referral code");
    } finally {
      setIsApplying(false);
    }
  };

  if (applied) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">Referral Applied!</p>
            <p className="text-sm text-green-600 dark:text-green-400">
              You'll receive $25 after your first booking
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Have a referral code?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Enter referral code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            className="uppercase"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
          <Button
            onClick={handleApply}
            disabled={isApplying || !code.trim()}
          >
            {isApplying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Apply"
            )}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter a friend's referral code to get $25 off your first booking
        </p>
      </CardContent>
    </Card>
  );
}
