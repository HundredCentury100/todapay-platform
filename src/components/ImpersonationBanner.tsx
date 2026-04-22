import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useNavigate } from "react-router-dom";

const ImpersonationBanner = () => {
  const { isImpersonating, impersonatedMerchant, endImpersonation } = useImpersonation();
  const navigate = useNavigate();

  if (!isImpersonating || !impersonatedMerchant) return null;

  const handleEnd = async () => {
    await endImpersonation();
    navigate('/merchant/admin');
  };

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-500/10 border-amber-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            <span className="font-medium">Impersonation Mode:</span> You are viewing as {impersonatedMerchant.business_name}
          </AlertDescription>
        </div>
        <Button size="sm" variant="outline" onClick={handleEnd}>
          <X className="h-4 w-4 mr-2" />
          End Session
        </Button>
      </div>
    </Alert>
  );
};

export default ImpersonationBanner;
