import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, Check, X } from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";

export type CancellationPolicyType = 'flexible' | 'moderate' | 'strict' | 'non_refundable';

interface PolicyDetails {
  name: string;
  description: string;
  rules: string[];
  icon: any;
  variant: "default" | "secondary" | "destructive" | "outline";
}

const POLICIES: Record<CancellationPolicyType, PolicyDetails> = {
  flexible: {
    name: "Flexible",
    description: "Full refund up to 24 hours before check-in",
    rules: [
      "Free cancellation up to 24 hours before check-in",
      "Full refund if cancelled within policy window",
      "50% refund if cancelled within 24 hours of check-in"
    ],
    icon: Check,
    variant: "default",
  },
  moderate: {
    name: "Moderate",
    description: "Full refund up to 5 days before check-in",
    rules: [
      "Free cancellation up to 5 days before check-in",
      "50% refund if cancelled 1-5 days before check-in",
      "No refund if cancelled within 24 hours of check-in"
    ],
    icon: Info,
    variant: "secondary",
  },
  strict: {
    name: "Strict",
    description: "50% refund up to 7 days before check-in",
    rules: [
      "50% refund if cancelled 7+ days before check-in",
      "No refund if cancelled within 7 days of check-in",
      "Full refund only if property cancels"
    ],
    icon: AlertTriangle,
    variant: "outline",
  },
  non_refundable: {
    name: "Non-Refundable",
    description: "No refund available",
    rules: [
      "This booking is non-refundable",
      "Lower price in exchange for no cancellation",
      "Refund only if property cancels"
    ],
    icon: X,
    variant: "destructive",
  },
};

interface CancellationPolicyProps {
  policyType: CancellationPolicyType;
  checkInDate?: string;
  totalPrice?: number;
  compact?: boolean;
}

export const CancellationPolicy = ({
  policyType,
  checkInDate,
  totalPrice,
  compact = false,
}: CancellationPolicyProps) => {
  const policy = POLICIES[policyType] || POLICIES.moderate;
  const Icon = policy.icon;

  const calculateRefund = () => {
    if (!checkInDate || !totalPrice) return null;

    const now = new Date();
    const checkIn = new Date(checkInDate);
    const daysUntilCheckIn = differenceInDays(checkIn, now);
    const hoursUntilCheckIn = differenceInHours(checkIn, now);

    let refundPercentage = 0;
    let message = "";

    switch (policyType) {
      case 'flexible':
        if (hoursUntilCheckIn > 24) {
          refundPercentage = 100;
          message = "Full refund available";
        } else if (hoursUntilCheckIn > 0) {
          refundPercentage = 50;
          message = "50% refund (within 24 hours of check-in)";
        } else {
          refundPercentage = 0;
          message = "No refund (after check-in time)";
        }
        break;
      case 'moderate':
        if (daysUntilCheckIn >= 5) {
          refundPercentage = 100;
          message = "Full refund available";
        } else if (daysUntilCheckIn >= 1) {
          refundPercentage = 50;
          message = "50% refund (1-5 days before check-in)";
        } else {
          refundPercentage = 0;
          message = "No refund (within 24 hours)";
        }
        break;
      case 'strict':
        if (daysUntilCheckIn >= 7) {
          refundPercentage = 50;
          message = "50% refund available";
        } else {
          refundPercentage = 0;
          message = "No refund (within 7 days)";
        }
        break;
      case 'non_refundable':
        refundPercentage = 0;
        message = "Non-refundable booking";
        break;
    }

    const refundAmount = (totalPrice * refundPercentage) / 100;

    return { refundPercentage, refundAmount, message };
  };

  const refundInfo = calculateRefund();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={policy.variant} className="text-xs">
          <Icon className="w-3 h-3 mr-1" />
          {policy.name}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {policy.description}
        </span>
      </div>
    );
  }

  return (
    <Alert variant={policyType === 'non_refundable' ? 'destructive' : 'default'}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {policy.name} Cancellation Policy
        <Badge variant={policy.variant} className="text-xs">
          {policy.name}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p className="text-sm">{policy.description}</p>
        <ul className="text-sm space-y-1">
          {policy.rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              {rule}
            </li>
          ))}
        </ul>
        {refundInfo && (
          <div className="mt-3 p-2 bg-muted rounded-lg">
            <p className="text-sm font-medium">{refundInfo.message}</p>
            {refundInfo.refundPercentage > 0 && (
              <p className="text-sm text-muted-foreground">
                You would receive ${refundInfo.refundAmount.toFixed(2)} back
              </p>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export const getCancellationPolicyFromPolicies = (policies: any): CancellationPolicyType => {
  if (!policies?.cancellation) return 'moderate';
  
  const cancellation = policies.cancellation.toLowerCase();
  if (cancellation.includes('flexible')) return 'flexible';
  if (cancellation.includes('strict')) return 'strict';
  if (cancellation.includes('non') || cancellation.includes('refund')) return 'non_refundable';
  return 'moderate';
};
