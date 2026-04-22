import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, Globe2 } from "lucide-react";

export interface Corridor {
  code: string;
  flag: string;
  country: string;
  currency: string;
  fxRate: number; // 1 USD = X local
  feePercentage: number;
  methods: ("bank" | "mobile_wallet" | "cash_pickup")[];
  deliveryHours: number;
}

export const CORRIDORS: Corridor[] = [
  { code: "ZA", flag: "🇿🇦", country: "South Africa", currency: "ZAR", fxRate: 18.5, feePercentage: 2.5, methods: ["bank", "mobile_wallet", "cash_pickup"], deliveryHours: 1 },
  { code: "BW", flag: "🇧🇼", country: "Botswana", currency: "BWP", fxRate: 13.6, feePercentage: 3, methods: ["bank", "mobile_wallet"], deliveryHours: 2 },
  { code: "ZM", flag: "🇿🇲", country: "Zambia", currency: "ZMW", fxRate: 26.0, feePercentage: 3, methods: ["bank", "mobile_wallet", "cash_pickup"], deliveryHours: 2 },
  { code: "MZ", flag: "🇲🇿", country: "Mozambique", currency: "MZN", fxRate: 63.5, feePercentage: 3.5, methods: ["bank", "mobile_wallet"], deliveryHours: 4 },
  { code: "GB", flag: "🇬🇧", country: "United Kingdom", currency: "GBP", fxRate: 0.79, feePercentage: 1.5, methods: ["bank"], deliveryHours: 24 },
  { code: "US", flag: "🇺🇸", country: "United States", currency: "USD", fxRate: 1.0, feePercentage: 1.5, methods: ["bank"], deliveryHours: 24 },
  { code: "KE", flag: "🇰🇪", country: "Kenya", currency: "KES", fxRate: 129, feePercentage: 3, methods: ["mobile_wallet", "bank"], deliveryHours: 1 },
  { code: "NG", flag: "🇳🇬", country: "Nigeria", currency: "NGN", fxRate: 1550, feePercentage: 4, methods: ["bank", "mobile_wallet"], deliveryHours: 4 },
];

interface Props {
  direction: "inward" | "outward";
  corridorCode: string;
  setCorridorCode: (v: string) => void;
  recipientName: string;
  setRecipientName: (v: string) => void;
  recipientMethod: "bank" | "mobile_wallet" | "cash_pickup";
  setRecipientMethod: (v: "bank" | "mobile_wallet" | "cash_pickup") => void;
  recipientDetails: string;
  setRecipientDetails: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
}

export const RemittanceForm = ({
  direction,
  corridorCode,
  setCorridorCode,
  recipientName,
  setRecipientName,
  recipientMethod,
  setRecipientMethod,
  recipientDetails,
  setRecipientDetails,
  amount,
  setAmount,
}: Props) => {
  const corridor = useMemo(() => CORRIDORS.find((c) => c.code === corridorCode), [corridorCode]);
  const numAmount = Number(amount) || 0;
  const fee = corridor ? (numAmount * corridor.feePercentage) / 100 : 0;
  const total = numAmount + fee;
  const receiveAmount = corridor ? numAmount * corridor.fxRate : 0;

  const detailsLabel = recipientMethod === "bank" ? "Bank Account / IBAN" : recipientMethod === "mobile_wallet" ? "Mobile Wallet Number" : "Recipient Phone";

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Globe2 className="h-4 w-4" /> {direction === "outward" ? "Send to country" : "Receive from country"}</Label>
        <Select value={corridorCode} onValueChange={setCorridorCode}>
          <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
          <SelectContent>
            {CORRIDORS.map((c) => (
              <SelectItem key={c.code} value={c.code}>{c.flag} {c.country} ({c.currency})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {direction === "outward" && (
        <>
          <div className="space-y-2">
            <Label>Recipient Full Name</Label>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="As on official ID" maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label>Delivery Method</Label>
            <Select value={recipientMethod} onValueChange={(v) => setRecipientMethod(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {corridor?.methods.includes("bank") && <SelectItem value="bank">🏦 Bank Transfer</SelectItem>}
                {corridor?.methods.includes("mobile_wallet") && <SelectItem value="mobile_wallet">📱 Mobile Wallet</SelectItem>}
                {corridor?.methods.includes("cash_pickup") && <SelectItem value="cash_pickup">💵 Cash Pickup</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{detailsLabel}</Label>
            <Input value={recipientDetails} onChange={(e) => setRecipientDetails(e.target.value)} placeholder={detailsLabel} maxLength={50} />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>You {direction === "outward" ? "send" : "receive"} (USD)</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min={5} />
      </div>

      {corridor && numAmount > 0 && (
        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Send amount</span><span>${numAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fee ({corridor.feePercentage}%)</span><span>${fee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Exchange rate</span><span>1 USD = {corridor.fxRate} {corridor.currency}</span></div>
            <div className="border-t pt-3 flex justify-between font-semibold"><span>You pay</span><span className="text-primary">${total.toFixed(2)}</span></div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground"><ArrowDown className="h-4 w-4" /></div>
            <div className="flex justify-between font-bold text-base"><span>Recipient gets</span><span className="text-primary">{receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {corridor.currency}</span></div>
            <p className="text-xs text-muted-foreground text-center pt-1">Delivered in ~{corridor.deliveryHours}h</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
