import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Ticket, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

const AuthRequiredDialog = ({ 
  open, 
  onOpenChange,
  title = "Sign In to Continue",
  description = "Please sign in to complete your booking and secure your seats."
}: AuthRequiredDialogProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignIn = () => {
    onOpenChange(false);
    navigate("/auth", { state: { returnTo: location.pathname + location.search } });
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="w-full max-w-md">
      <ResponsiveModalHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <ResponsiveModalTitle className="text-xl">{title}</ResponsiveModalTitle>
        <ResponsiveModalDescription className="text-center">
          {description}
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>
      
      <div className="space-y-4 mt-4 px-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Ticket className="h-4 w-4 text-primary" />
            <span>Save your booking history</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <UserPlus className="h-4 w-4 text-primary" />
            <span>Get personalized recommendations</span>
          </div>
        </div>
      </div>

      <ResponsiveModalFooter className="flex flex-col gap-2 pt-4">
        <Button onClick={handleSignIn} className="w-full">
          Sign In / Create Account
        </Button>
        <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
          Cancel
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
};

export default AuthRequiredDialog;
