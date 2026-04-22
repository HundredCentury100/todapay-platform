import { useState } from "react";
import { CheckCircle, Copy, Download, Share2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { downloadBillReceipt, getBillReceiptBlob, BillReceiptData } from "@/utils/billReceiptPdfGenerator";

interface UniversalReceiptData {
  reference: string;
  billerName: string;
  billerType: string;
  accountNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  dateTime: string;
  logoUrl?: string;
  // ZESA-specific
  tokens?: string[];
  kwh?: string;
  energyCharge?: string;
  debt?: string;
  reaLevy?: string;
  vat?: string;
}

interface UniversalBillReceiptProps {
  data: UniversalReceiptData;
  onDone: () => void;
}

export const UniversalBillReceipt = ({ data, onDone }: UniversalBillReceiptProps) => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const receiptData: BillReceiptData = {
    ...data,
    status: "completed",
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token.replace(/\s/g, ""));
    toast({ title: "Token Copied!", description: "Enter this token into your meter" });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadBillReceipt(receiptData);
      toast({ title: "Downloaded!", description: "Receipt saved to your device" });
    } catch {
      toast({ title: "Error", description: "Failed to download receipt", variant: "destructive" });
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        const blob = await getBillReceiptBlob(receiptData);
        const file = new File([blob], `receipt-${data.reference}.pdf`, { type: "application/pdf" });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `${data.billerName} Payment Receipt`,
            text: `Payment of ${data.currency} ${data.amount.toFixed(2)} to ${data.billerName} - Ref: ${data.reference}`,
            files: [file],
          });
        } else {
          await navigator.share({
            title: `${data.billerName} Payment Receipt`,
            text: `Payment of ${data.currency} ${data.amount.toFixed(2)} to ${data.billerName}\nAccount: ${data.accountNumber}\nRef: ${data.reference}\nDate: ${data.dateTime}${data.tokens ? `\nToken: ${data.tokens.join(", ")}` : ""}`,
          });
        }
      } else {
        // Fallback: copy receipt text
        const text = `${data.billerName} Payment Receipt\nAmount: ${data.currency} ${data.amount.toFixed(2)}\nAccount: ${data.accountNumber}\nRef: ${data.reference}\nDate: ${data.dateTime}${data.tokens ? `\nToken: ${data.tokens.join(", ")}` : ""}`;
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "Receipt details copied to clipboard" });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast({ title: "Share failed", description: "Could not share receipt", variant: "destructive" });
      }
    }
    setSharing(false);
  };

  const isZesa = !!data.tokens;

  return (
    <Card className="rounded-3xl border-0 shadow-xl overflow-hidden">
      {/* Success Header */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 text-center">
        {data.logoUrl ? (
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 p-2 shadow-lg">
            <img src={data.logoUrl} alt={data.billerName} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8" />
          </div>
        )}
        <h2 className="text-xl font-bold">Payment Successful!</h2>
        <p className="text-sm opacity-90 mt-1">Ref: {data.reference}</p>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Merchant & Amount Summary */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{data.billerName}</p>
          <p className="text-3xl font-bold mt-1">
            {data.currency} {data.amount.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{data.dateTime}</p>
        </div>

        {/* Token Numbers - ZESA only */}
        {isZesa && data.tokens && (
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
                <p className="font-mono text-lg font-bold tracking-wider text-foreground">{token}</p>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Copy className="w-3 h-3" />
                  <span>Tap to copy</span>
                </div>
                {data.tokens!.length > 1 && (
                  <p className="text-xs text-primary font-medium mt-1">Token {idx + 1} of {data.tokens!.length}</p>
                )}
              </button>
            ))}
            {data.tokens.length > 1 && (
              <p className="text-xs text-destructive font-medium text-center">
                ⚠️ Enter tokens strictly in the order shown above
              </p>
            )}
          </div>
        )}

        {/* Receipt Details */}
        <div className="bg-muted/50 rounded-2xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Merchant</span>
            <span className="font-semibold">{data.billerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account</span>
            <span className="font-mono font-semibold">{data.accountNumber}</span>
          </div>
          {isZesa && (
            <>
              {data.kwh && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KwH</span>
                  <span className="font-semibold">{data.kwh}</span>
                </div>
              )}
              <div className="border-t border-border my-1" />
              {data.energyCharge && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Energy</span>
                  <span>{data.energyCharge}</span>
                </div>
              )}
              {data.debt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Debt</span>
                  <span>{data.debt}</span>
                </div>
              )}
              {data.reaLevy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">REA Levy</span>
                  <span>{data.reaLevy}</span>
                </div>
              )}
              {data.vat && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT</span>
                  <span>{data.vat}</span>
                </div>
              )}
            </>
          )}
          <div className="border-t border-border my-1" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{data.currency} {data.amount.toFixed(2)}</span>
          </div>
          <div className="border-t border-border my-1" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Payment</span>
            <span>Suvat Pay</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono">{data.reference}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-xl h-12 gap-2"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Saving..." : "Download"}
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={sharing}
            className="rounded-xl h-12 gap-2"
          >
            <Share2 className="w-4 h-4" />
            {sharing ? "Sharing..." : "Share"}
          </Button>
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
