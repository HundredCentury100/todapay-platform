import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { transferTicket } from "@/services/ticketSharingService";

interface TicketTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  currentEmail: string;
  transferCount: number;
  onTransferComplete?: () => void;
}

const TicketTransferDialog = ({
  open,
  onOpenChange,
  bookingId,
  currentEmail,
  transferCount,
  onTransferComplete
}: TicketTransferDialogProps) => {
  const [toEmail, setToEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const canTransfer = transferCount < 2;
  const remainingTransfers = 2 - transferCount;

  const handleTransfer = async () => {
    if (!toEmail || !confirmEmail) {
      return;
    }

    if (toEmail !== confirmEmail) {
      return;
    }

    if (toEmail === currentEmail) {
      return;
    }

    setLoading(true);
    try {
      await transferTicket({
        bookingId,
        toEmail,
        fromEmail: currentEmail
      });
      
      setToEmail("");
      setConfirmEmail("");
      onOpenChange(false);
      
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (error) {
      // Error handled in service
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Ticket Ownership</DialogTitle>
          <DialogDescription>
            Transfer this ticket to another person permanently
          </DialogDescription>
        </DialogHeader>

        {!canTransfer ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Maximum transfer limit reached. This ticket has already been transferred 2 times.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This action is permanent. The ticket will be transferred to the new email address and you will lose access to it.
                <div className="mt-2 text-sm">
                  Remaining transfers: <strong>{remainingTransfers}</strong>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 text-sm">
                <div className="text-muted-foreground">From</div>
                <div className="font-medium">{currentEmail}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-sm">
                <div className="text-muted-foreground">To</div>
                <div className="font-medium">{toEmail || "New owner"}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="to-email">Recipient Email Address</Label>
                <Input
                  id="to-email"
                  type="email"
                  placeholder="recipient@example.com"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-email">Confirm Email Address</Label>
                <Input
                  id="confirm-email"
                  type="email"
                  placeholder="recipient@example.com"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {toEmail && confirmEmail && toEmail !== confirmEmail && (
              <Alert variant="destructive">
                <AlertDescription>Email addresses do not match</AlertDescription>
              </Alert>
            )}

            {toEmail && toEmail === currentEmail && (
              <Alert variant="destructive">
                <AlertDescription>Cannot transfer to the same email address</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          {canTransfer && (
            <Button
              onClick={handleTransfer}
              disabled={
                loading ||
                !toEmail ||
                !confirmEmail ||
                toEmail !== confirmEmail ||
                toEmail === currentEmail
              }
            >
              {loading ? "Transferring..." : "Transfer Ticket"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketTransferDialog;
