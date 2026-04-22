import { CheckCircle, Copy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ReceiptData {
  tokens: string[];
  meterNumber: string;
  kwh: string;
  energyCharge: string;
  debt: string;
  reaLevy: string;
  vat: string;
  total: string;
  tendered: string;
  transactionCurrency: string;
  settlementCurrency: string;
  dateTime: string;
  reference: string;
}

interface BillPaymentReceiptProps {
  data: ReceiptData;
  onDone: () => void;
}

export const BillPaymentReceipt = ({ data, onDone }: BillPaymentReceiptProps) => {
  const { toast } = useToast();

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token.replace(/\s/g, ''));
    toast({ title: "Token Copied!", description: "Enter this token into your meter" });
  };

  return (
    <Card className="rounded-3xl border-0 shadow-xl overflow-hidden">
      {/* Success Header */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Token Purchased!</h2>
        <p className="text-sm opacity-90 mt-1">Ref: {data.reference}</p>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Token Numbers - CRITICAL: Must be entered in strict order */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h3 className="font-bold text-sm">
              {data.tokens.length > 1 ? "Tokens (enter in this exact order)" : "Your Token"}
            </h3>
          </div>
          {data.tokens.map((token, idx) => (
            <button
              key={idx}
              onClick={() => copyToken(token)}
              className="w-full bg-muted rounded-2xl p-4 text-center group hover:bg-primary/5 transition-colors press-effect"
            >
              <p className="font-mono text-lg font-bold tracking-wider text-foreground">
                {token}
              </p>
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                <Copy className="w-3 h-3" />
                <span>Tap to copy</span>
              </div>
              {data.tokens.length > 1 && (
                <p className="text-xs text-primary font-medium mt-1">Token {idx + 1} of {data.tokens.length}</p>
              )}
            </button>
          ))}
          {data.tokens.length > 1 && (
            <p className="text-xs text-destructive font-medium text-center">
              ⚠️ Enter tokens strictly in the order shown above
            </p>
          )}
        </div>

        {/* Receipt Details - Following ZETDC SMS layout spec */}
        <div className="bg-muted/50 rounded-2xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Meter</span>
            <span className="font-mono font-semibold">{data.meterNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">KwH</span>
            <span className="font-semibold">{data.kwh}</span>
          </div>
          <div className="border-t border-border my-1" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Energy</span>
            <span>{data.energyCharge}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Debt</span>
            <span>{data.debt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">REA Levy</span>
            <span>{data.reaLevy}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span>{data.vat}</span>
          </div>
          <div className="border-t border-border my-1" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{data.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tendered</span>
            <span>{data.tendered}</span>
          </div>
          <div className="border-t border-border my-1" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Date/Time</span>
            <span>{data.dateTime}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">TCC</span>
            <span>{data.transactionCurrency}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">SCC</span>
            <span>{data.settlementCurrency}</span>
          </div>
        </div>

        {/* Powered by */}
        <p className="text-xs text-center text-muted-foreground">
          Powered by <span className="font-semibold text-primary">Suvat Pay</span>
        </p>

        <Button onClick={onDone} className="w-full h-14 rounded-full text-lg font-semibold">
          Done
        </Button>
      </CardContent>
    </Card>
  );
};
