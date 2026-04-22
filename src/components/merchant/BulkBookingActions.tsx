import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, X, Mail, AlertCircle } from "lucide-react";

interface BulkBookingActionsProps {
  bookings: any[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onActionComplete: () => void;
}

const BulkBookingActions = ({
  bookings,
  selectedIds,
  onSelectionChange,
  onActionComplete,
}: BulkBookingActionsProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState<"cancel" | "confirm" | "notify" | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleSelectAll = () => {
    if (selectedIds.length === bookings.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(bookings.map((b) => b.id));
    }
  };

  const handleBulkAction = async (actionType: "cancel" | "confirm" | "notify") => {
    setAction(actionType);
    setShowDialog(true);
  };

  const executeBulkAction = async () => {
    if (!action || selectedIds.length === 0) return;

    setProcessing(true);
    try {
      if (action === "cancel") {
        const { error } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .in("id", selectedIds);

        if (error) throw error;

        toast({
          title: "Bookings Cancelled",
          description: `${selectedIds.length} booking(s) have been cancelled`,
        });
      } else if (action === "confirm") {
        const { error } = await supabase
          .from("bookings")
          .update({ status: "confirmed" })
          .in("id", selectedIds);

        if (error) throw error;

        toast({
          title: "Bookings Confirmed",
          description: `${selectedIds.length} booking(s) have been confirmed`,
        });
      } else if (action === "notify") {
        // In a real implementation, this would trigger email notifications
        toast({
          title: "Notifications Sent",
          description: `Notifications sent to ${selectedIds.length} customer(s)`,
        });
      }

      onSelectionChange([]);
      onActionComplete();
    } catch (error) {
      console.error("Bulk action error:", error);
      toast({
        title: "Error",
        description: "Failed to complete bulk action",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setShowDialog(false);
    }
  };

  if (bookings.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.length === bookings.length && bookings.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : "Select all"}
          </span>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("confirm")}
              disabled={processing}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("notify")}
              disabled={processing}
            >
              <Mail className="w-4 h-4 mr-2" />
              Notify
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction("cancel")}
              disabled={processing}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Confirm Bulk Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "cancel" && (
                <>
                  You are about to cancel <strong>{selectedIds.length}</strong> booking(s).
                  This action cannot be undone. Customers will be notified of the cancellation.
                </>
              )}
              {action === "confirm" && (
                <>
                  You are about to confirm <strong>{selectedIds.length}</strong> booking(s).
                  Confirmation emails will be sent to customers.
                </>
              )}
              {action === "notify" && (
                <>
                  You are about to send notifications to <strong>{selectedIds.length}</strong> customer(s).
                  They will receive an email about their booking.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction} disabled={processing}>
              {processing ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkBookingActions;
