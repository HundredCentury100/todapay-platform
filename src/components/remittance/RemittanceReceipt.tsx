import { CheckCircle2, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Props {
  referenceCode: string;
  recipientName: string;
  recipientCountry: string;
  sendAmount: number;
  receiveAmount: number;
  receiveCurrency: string;
  fxRate: number;
  fee: number;
  deliveryHours: number;
  onDone: () => void;
}

export const RemittanceReceipt = ({
  referenceCode, recipientName, recipientCountry, sendAmount,
  receiveAmount, receiveCurrency, fxRate, fee, deliveryHours, onDone,
}: Props) => {
  const handleShare = async () => {
    const text = `Remittance sent!\n\nRef: ${referenceCode}\nTo: ${recipientName} (${recipientCountry})\nAmount: ${receiveAmount.toFixed(2)} ${receiveCurrency}\nDelivery: ~${deliveryHours}h`;
    if (navigator.share) {
      try { await navigator.share({ title: "Remittance Receipt", text }); } catch {}
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Receipt copied to clipboard");
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-3 py-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-primary">Transfer Initiated!</h2>
        <p className="text-sm text-muted-foreground">Your money is on its way to {recipientName}</p>
      </div>

      <Card className="rounded-2xl border-2 border-primary/20">
        <CardContent className="p-6 space-y-3 text-sm">
          <div className="text-center pb-3 border-b">
            <p className="text-xs text-muted-foreground">Reference Number</p>
            <p className="font-mono font-bold text-lg">{referenceCode}</p>
          </div>
          <div className="flex justify-between"><span className="text-muted-foreground">Recipient</span><span className="font-medium">{recipientName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span>{recipientCountry}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Send amount</span><span>${sendAmount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span>${fee.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">FX rate</span><span>1 USD = {fxRate} {receiveCurrency}</span></div>
          <div className="border-t pt-3 flex justify-between font-bold"><span>Recipient gets</span><span className="text-primary">{receiveAmount.toFixed(2)} {receiveCurrency}</span></div>
          <p className="text-xs text-muted-foreground text-center pt-2">Expected delivery: ~{deliveryHours}h</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button variant="outline" className="w-full rounded-xl" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" /> Share Receipt
        </Button>
        <Button className="w-full rounded-xl" onClick={onDone}>Done</Button>
      </div>
    </div>
  );
};
