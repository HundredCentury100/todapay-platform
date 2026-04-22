import { Badge } from "@/components/ui/badge";
import { Store, Globe, UserCheck, CreditCard, Hash, MapPin } from "lucide-react";

interface TicketPurchaseDetailsProps {
  purchaseChannel?: 'online' | 'agent' | 'pos';
  agentCode?: string;
  agentName?: string;
  purchaseLocation?: string;
  paymentMethod?: string;
  paymentReference?: string;
  purchasedAt?: string;
}

export const TicketPurchaseDetails = ({
  purchaseChannel = 'online',
  agentCode,
  agentName,
  purchaseLocation,
  paymentMethod,
  paymentReference,
  purchasedAt,
}: TicketPurchaseDetailsProps) => {
  const channelLabel = purchaseChannel === 'agent' ? 'Agent' : purchaseChannel === 'pos' ? 'POS Terminal' : 'Online';
  const ChannelIcon = purchaseChannel === 'agent' ? UserCheck : purchaseChannel === 'pos' ? Store : Globe;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="px-4 py-2.5 border-b border-dashed border-muted-foreground/20 bg-muted/20">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Purchase Details</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {/* Channel */}
        <div className="flex items-center gap-1.5">
          <ChannelIcon className="h-3 w-3 text-muted-foreground shrink-0" />
          <div>
            <p className="text-[9px] text-muted-foreground">Channel</p>
            <p className="text-[11px] font-medium">{channelLabel}</p>
          </div>
        </div>

        {/* Payment Method */}
        {paymentMethod && (
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3 w-3 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[9px] text-muted-foreground">Payment</p>
              <p className="text-[11px] font-medium">{paymentMethod}</p>
            </div>
          </div>
        )}

        {/* Agent Code */}
        {purchaseChannel === 'agent' && agentCode && (
          <div className="flex items-center gap-1.5">
            <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[9px] text-muted-foreground">Agent Code</p>
              <p className="text-[11px] font-mono font-bold text-primary">{agentCode}</p>
            </div>
          </div>
        )}

        {/* Purchase Location */}
        {purchaseLocation && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[9px] text-muted-foreground">Location</p>
              <p className="text-[11px] font-medium truncate max-w-[120px]">{purchaseLocation}</p>
            </div>
          </div>
        )}

        {/* Payment Reference */}
        {paymentReference && (
          <div className="col-span-2 flex items-center gap-1.5 mt-0.5">
            <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-muted-foreground">Payment Ref</p>
              <p className="text-[11px] font-mono font-medium truncate">{paymentReference}</p>
            </div>
          </div>
        )}

        {/* Purchase Date */}
        {purchasedAt && (
          <div className="col-span-2 mt-0.5">
            <p className="text-[9px] text-muted-foreground">
              Purchased: {formatDate(purchasedAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
