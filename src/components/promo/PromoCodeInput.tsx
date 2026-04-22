import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, X, Check, Ticket } from "lucide-react";
import { validatePromoCode, PromoValidationResult } from "@/services/promoCodeService";
import { getActiveVouchersForCheckout, UserVoucher } from "@/services/voucherService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AppliedPromoData {
  code: string;
  discount: number;
  discount_type?: string;
  discount_value?: number;
  description?: string;
  promo_code_id?: string;
  voucher_id?: string;
}

interface PromoCodeInputProps {
  orderAmount: number;
  vertical: string;
  onPromoApplied: (result: AppliedPromoData) => void;
  onPromoRemoved: () => void;
  appliedPromo?: AppliedPromoData | null;
  className?: string;
}

export function PromoCodeInput({
  orderAmount,
  vertical,
  onPromoApplied,
  onPromoRemoved,
  appliedPromo,
  className
}: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<UserVoucher[]>([]);

  useEffect(() => {
    if (!appliedPromo) {
      getActiveVouchersForCheckout(vertical, orderAmount).then(setAvailableVouchers);
    }
  }, [vertical, orderAmount, appliedPromo]);

  const handleApply = async () => {
    if (!code.trim()) {
      setError("Please enter a promo code");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const result = await validatePromoCode(code, orderAmount, vertical);
      
      if (result.valid && result.discount !== undefined) {
        onPromoApplied({
          code: code.toUpperCase(),
          discount: result.discount,
          discount_type: result.discount_type,
          discount_value: result.discount_value,
          description: result.description,
          promo_code_id: result.promo_code_id,
        });
        toast.success(`Promo code applied! You save $${result.discount.toFixed(2)}`);
        setCode("");
      } else {
        setError(result.error || "Invalid promo code");
      }
    } catch {
      setError("Failed to validate promo code");
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyVoucher = (voucher: UserVoucher) => {
    let discount = 0;
    if (voucher.discount_type === 'percentage') {
      discount = orderAmount * (voucher.discount_value / 100);
      if (voucher.max_discount_amount) discount = Math.min(discount, voucher.max_discount_amount);
    } else {
      discount = Math.min(voucher.discount_value, orderAmount);
    }

    onPromoApplied({
      code: voucher.code,
      discount,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      description: voucher.description,
      voucher_id: voucher.id,
    });
    toast.success(`Voucher applied! You save $${discount.toFixed(2)}`);
  };

  const handleRemove = () => {
    onPromoRemoved();
    setCode("");
    setError(null);
  };

  if (appliedPromo) {
    return (
      <div className={cn("rounded-lg border border-primary/30 bg-primary/5 p-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <Check className="w-3 h-3 mr-1" />
              {appliedPromo.discount_type === 'percentage' 
                ? `${appliedPromo.discount_value}% OFF`
                : `$${appliedPromo.discount_value || appliedPromo.discount} OFF`
              }
            </Badge>
            <span className="text-sm font-medium">{appliedPromo.code}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{appliedPromo.description || 'Promo applied'}</p>
        <p className="text-sm font-medium text-primary mt-1">You save ${appliedPromo.discount.toFixed(2)}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Voucher quick-select chips */}
      {availableVouchers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Ticket className="w-3 h-3" /> Available vouchers
          </p>
          <div className="flex flex-wrap gap-2">
            {availableVouchers.slice(0, 3).map(voucher => (
              <Button
                key={voucher.id}
                variant="outline"
                size="sm"
                className="rounded-full text-xs h-7 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => handleApplyVoucher(voucher)}
              >
                {voucher.discount_type === 'percentage'
                  ? `${voucher.discount_value}% OFF`
                  : `$${voucher.discount_value} OFF`
                }
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Code input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            className="pl-9 uppercase"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={isValidating || !code.trim()}
          variant="outline"
        >
          {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
