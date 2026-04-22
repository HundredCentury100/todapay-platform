import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function DeleteAccountDialog() {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmation !== "DELETE") return;
    
    setIsDeleting(true);
    try {
      // Call edge function to handle account deletion
      const { error } = await supabase.functions.invoke('delete-account');
      
      if (error) throw error;
      
      await supabase.auth.signOut();
      toast.success("Your account has been scheduled for deletion.");
      navigate("/");
    } catch (error) {
      console.error("Account deletion error:", error);
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-3 px-4 py-3.5">
          <Trash2 className="h-5 w-5" />
          <span className="font-medium text-sm">Delete Account</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Your Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>This action is <strong>permanent and cannot be undone</strong>. The following will be deleted:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Your profile and personal information</li>
              <li>Wallet balance and transaction history</li>
              <li>Booking history and saved preferences</li>
              <li>Loyalty points and rewards</li>
              <li>Any merchant/agent/driver profiles</li>
            </ul>
            <p className="text-sm">
              Note: Transaction records required for tax compliance (ZIMRA) will be retained in anonymised form for 7 years.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-delete" className="text-sm font-medium">
            Type <span className="font-bold text-destructive">DELETE</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Type DELETE"
            className="font-mono"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmation("")}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmation !== "DELETE" || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Permanently Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
