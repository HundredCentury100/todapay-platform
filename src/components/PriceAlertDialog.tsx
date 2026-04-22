import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, BellRing, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { savePriceAlert, getPriceAlerts, deletePriceAlert, PriceAlert } from "@/services/pricePredictionService";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PriceAlertDialogProps {
  itemId: string;
  itemName: string;
  itemType: 'bus' | 'event';
  currentPrice: number;
  routeFrom?: string;
  routeTo?: string;
}

const PriceAlertDialog = ({
  itemId,
  itemName,
  itemType,
  currentPrice,
  routeFrom = '',
  routeTo = '',
}: PriceAlertDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState(Math.round(currentPrice * 0.9));
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => 
    getPriceAlerts().filter(a => a.itemId === itemId)
  );
  const { convertPrice, currency } = useCurrency();

  const handleCreateAlert = () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (targetPrice >= currentPrice) {
      toast.error('Target price must be lower than current price');
      return;
    }

    const newAlert = savePriceAlert({
      email,
      routeFrom,
      routeTo,
      targetPrice,
      currentPrice,
      itemType,
      itemId,
      itemName,
      isActive: true,
    });

    setAlerts(prev => [...prev, newAlert]);
    toast.success('Price alert created! We\'ll notify you when the price drops.');
    setEmail('');
  };

  const handleDeleteAlert = (alertId: string) => {
    deletePriceAlert(alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    toast.success('Price alert removed');
  };

  const discount = Math.round(((currentPrice - targetPrice) / currentPrice) * 100);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="w-4 h-4" />
          Price Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" />
            Set Price Alert
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="font-medium">{itemName}</p>
            {routeFrom && routeTo && (
              <p className="text-sm text-muted-foreground">{routeFrom} → {routeTo}</p>
            )}
            <p className="text-lg font-bold text-primary mt-2">
              Current: {convertPrice(currentPrice)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email for notification</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
          <Label htmlFor="targetPrice">
            Alert me when price drops to ({currency.code})
          </Label>
            <Input
              id="targetPrice"
              type="number"
              min={1}
              max={currentPrice - 1}
              value={targetPrice}
              onChange={(e) => setTargetPrice(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {discount}% below current price
            </p>
          </div>

          <Button onClick={handleCreateAlert} className="w-full">
            <Bell className="w-4 h-4 mr-2" />
            Create Alert
          </Button>

          {alerts.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium">Your active alerts:</p>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between bg-muted/30 rounded-lg p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Target: {convertPrice(alert.targetPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground">{alert.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceAlertDialog;
