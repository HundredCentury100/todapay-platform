import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { UniversalCheckout } from './UniversalCheckout';
import { 
  getCurrentEmployeeAccount, 
  getDefaultPolicy, 
  validateBookingAgainstPolicy,
  requiresApproval,
  createCorporateBooking,
  type CorporateAccount,
  type CorporateEmployee,
  type CorporateTravelPolicy,
  type PolicyViolation
} from '@/services/corporateService';
import { MerchantPaymentMethod } from '@/types/payment';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CorporateCheckoutWrapperProps {
  bookingData: {
    type: 'bus' | 'event' | 'stay' | 'workspace' | 'venue' | 'experience';
    itemName: string;
    totalPrice: number;
    itemId: string;
    date?: string;
    from?: string;
    to?: string;
    departureTime?: string;
    arrivalTime?: string;
    selectedSeats?: string[];
    operator?: string;
    eventDate?: string;
    eventTime?: string;
    venue?: string;
    ticketQuantity?: number;
    checkInDate?: string;
    checkOutDate?: string;
    roomName?: string;
    numGuests?: number;
    numRooms?: number;
    propertyCity?: string;
    startDatetime?: string;
    endDatetime?: string;
    workspaceType?: string;
    numAttendees?: number;
    passengerName: string;
    passengerEmail: string;
    passengerPhone: string;
    reservationType?: string;
    reservationExpiresAt?: string;
  };
  paymentMethods: MerchantPaymentMethod[];
  merchantProfileId: string | null;
  onPaymentComplete: (paymentData: any) => Promise<void>;
  isLoading?: boolean;
}

export const CorporateCheckoutWrapper = ({
  bookingData,
  paymentMethods,
  merchantProfileId,
  onPaymentComplete,
  isLoading = false
}: CorporateCheckoutWrapperProps) => {
  const { convertPrice } = useCurrency();
  const [corporateAccount, setCorporateAccount] = useState<CorporateAccount | null>(null);
  const [employee, setEmployee] = useState<CorporateEmployee | null>(null);
  const [policy, setPolicy] = useState<CorporateTravelPolicy | null>(null);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isCorporateUser, setIsCorporateUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useCorporate, setUseCorporate] = useState(true);

  useEffect(() => {
    const loadCorporateData = async () => {
      try {
        const result = await getCurrentEmployeeAccount();
        if (result) {
          setCorporateAccount(result.account);
          setEmployee(result.employee);
          setIsCorporateUser(true);

          const defaultPolicy = await getDefaultPolicy(result.account.id);
          setPolicy(defaultPolicy);

          if (defaultPolicy) {
            const travelDate = bookingData.date || bookingData.eventDate || 
                              bookingData.checkInDate || bookingData.startDatetime;
            
            const policyViolations = validateBookingAgainstPolicy(
              defaultPolicy,
              result.employee,
              bookingData.type,
              bookingData.totalPrice,
              travelDate ? new Date(travelDate) : new Date()
            );
            setViolations(policyViolations);
            setNeedsApproval(requiresApproval(defaultPolicy, bookingData.totalPrice));
          }
        }
      } catch (error) {
        console.error('Error loading corporate data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCorporateData();
  }, [bookingData]);

  const handleCorporatePayment = async (paymentData: any) => {
    if (!corporateAccount || !employee) {
      return onPaymentComplete(paymentData);
    }

    try {
      // Create corporate booking record - serialize violations as strings
      const violationStrings = violations.map(v => `${v.type}: ${v.message}`);
      
      await createCorporateBooking({
        corporate_account_id: corporateAccount.id,
        employee_id: employee.id,
        booking_id: paymentData.bookingId || '',
        policy_id: policy?.id,
        travel_purpose: `${bookingData.type} booking: ${bookingData.itemName}`,
        approval_status: needsApproval ? 'pending' : 'approved',
        policy_violations: violationStrings.length > 0 ? violationStrings : undefined,
        invoiced: false,
        cost_center: employee.department
      });

      // Continue with regular payment flow
      await onPaymentComplete({
        ...paymentData,
        isCorporateBooking: true,
        corporateAccountId: corporateAccount.id,
        needsApproval
      });
    } catch (error) {
      console.error('Corporate booking error:', error);
      throw error;
    }
  };

  const hasErrors = violations.some(v => v.severity === 'error');

  // If not a corporate user or chose not to use corporate, use regular checkout
  if (!isCorporateUser || !useCorporate) {
    return (
      <div className="space-y-4">
        {isCorporateUser && (
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertTitle>Corporate Account Available</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Book through your company account for easier expense tracking.</span>
              <Button size="sm" variant="outline" onClick={() => setUseCorporate(true)}>
                Use Corporate
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <UniversalCheckout
          bookingData={bookingData}
          paymentMethods={paymentMethods}
          merchantProfileId={merchantProfileId}
          onPaymentComplete={onPaymentComplete}
          isLoading={isLoading}
          allowSplitPayment={true}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Loading corporate account...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Corporate Account Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Corporate Booking
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setUseCorporate(false)}
            >
              Book Personally
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Company:</span>
              <p className="font-medium">{corporateAccount?.company_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Employee:</span>
              <p className="font-medium flex items-center gap-1">
                <User className="h-3 w-3" />
                {employee?.employee_name}
              </p>
            </div>
            {employee?.department && (
              <div>
                <span className="text-muted-foreground">Department:</span>
                <p className="font-medium">{employee.department}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Travel Tier:</span>
              <Badge variant="outline" className="ml-1 capitalize">
                {employee?.travel_tier || 'standard'}
              </Badge>
            </div>
          </div>

          {policy && (
            <>
              <Separator />
              <div className="text-sm">
                <span className="text-muted-foreground">Policy:</span>
                <span className="font-medium ml-1">{policy.policy_name}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Policy Violations */}
      {violations.length > 0 && (
        <div className="space-y-2">
          {violations.map((violation, index) => (
            <Alert 
              key={index} 
              variant={violation.severity === 'error' ? 'destructive' : 'default'}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="capitalize">{violation.type.replace('_', ' ')} Issue</AlertTitle>
              <AlertDescription>{violation.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Approval Required Notice */}
      {needsApproval && !hasErrors && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Manager Approval Required</AlertTitle>
          <AlertDescription>
            This booking exceeds {convertPrice(policy?.approval_required_above || 0)} and 
            requires manager approval. You can complete the booking now, and it will be 
            held pending approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Checkout blocked for policy errors */}
      {hasErrors ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Booking Not Allowed</AlertTitle>
          <AlertDescription>
            This booking violates your company's travel policy. Please contact your 
            travel administrator for assistance or book personally.
          </AlertDescription>
        </Alert>
      ) : (
        <UniversalCheckout
          bookingData={bookingData}
          paymentMethods={paymentMethods}
          merchantProfileId={merchantProfileId}
          onPaymentComplete={handleCorporatePayment}
          isLoading={isLoading}
          allowSplitPayment={false} // Corporate bookings don't allow split payment
        />
      )}

      {/* Booking will be invoiced notice */}
      {!hasErrors && corporateAccount && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>This booking will be added to your corporate invoice</span>
        </div>
      )}
    </div>
  );
};
