import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { MerchantProfile } from "@/types/merchant";

interface PendingApprovalBannerProps {
  profile: MerchantProfile;
}

const PendingApprovalBanner = ({ profile }: PendingApprovalBannerProps) => {
  if (profile.verification_status === 'verified') {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">Approved! 🎉</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          Your merchant profile has been approved. You now have full access to all features.
        </AlertDescription>
      </Alert>
    );
  }

  if (profile.verification_status === 'rejected') {
    return (
      <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-200">Profile Rejected</AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300">
          Your merchant profile was not approved. Please contact support for more information.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
      <Clock className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800 dark:text-orange-200">Pending Approval</AlertTitle>
      <AlertDescription className="text-orange-700 dark:text-orange-300">
        Your merchant profile is under review. You can explore the portal, but some features are locked until approval.
        Estimated approval time: 24-48 hours.
      </AlertDescription>
    </Alert>
  );
};

export default PendingApprovalBanner;
