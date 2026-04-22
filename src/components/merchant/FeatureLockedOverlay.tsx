import { Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FeatureLockedOverlayProps {
  message?: string;
}

const FeatureLockedOverlay = ({ message = "This feature will be available once your profile is approved" }: FeatureLockedOverlayProps) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
        <Alert className="max-w-md mx-4">
          <Lock className="h-4 w-4" />
          <AlertTitle>Feature Locked</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default FeatureLockedOverlay;
