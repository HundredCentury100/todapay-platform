import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BackButton from "@/components/BackButton";
import MobileAppLayout from "@/components/MobileAppLayout";
import { CheckCircle, User, Mail, Phone, Info, UserPlus, ArrowRight, MapPin, Calendar, Clock, Ticket, Loader2, Shield, Sparkles, Banknote, Smartphone, ChevronDown, ChevronUp, Wallet, CreditCard, QrCode, Lock } from "lucide-react";
import omariLogo from "@/assets/omari-logo.png";
import innbucksLogo from "@/assets/innbucks-logo.png";
import { AccountBenefitsCard, InlineAccountPrompt } from "@/components/booking/smart-checkout";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAgentBooking } from "@/contexts/AgentBookingContext";
import { WorldClassBusTicket } from "@/components/tickets/WorldClassBusTicket";
import { WorldClassEventTicket } from "@/components/tickets/WorldClassEventTicket";
import { WorldClassStayTicket } from "@/components/tickets/WorldClassStayTicket";
import { WorldClassWorkspaceTicket } from "@/components/tickets/WorldClassWorkspaceTicket";
import { WorldClassExperienceTicket } from "@/components/tickets/WorldClassExperienceTicket";
import { WorldClassTransferTicket } from "@/components/tickets/WorldClassTransferTicket";
import { WorldClassCarRentalTicket } from "@/components/tickets/WorldClassCarRentalTicket";
import { WorldClassVenueTicket } from "@/components/tickets/WorldClassVenueTicket";
import { generateEnhancedPDF } from "@/utils/enhancedPdfGenerator";
import { downloadWalletPass } from "@/utils/walletPassGenerator";
import { formatTimestamp } from "@/utils/dateFormatters";
import { createBooking } from "@/services/bookingService";
import { createAgentBooking } from "@/services/agentBookingService";
import { bookSeats } from "@/services/busService";
import { bookEventSeats } from "@/services/eventService";
import { supabase } from "@/integrations/supabase/client";
import { getMerchantPaymentMethods, createTransaction, calculatePlatformFee, uploadPaymentProof } from "@/services/paymentService";
import { agentRemittanceService } from "@/services/agentRemittanceService";
import { MerchantPaymentMethod } from "@/types/payment";
import { UniversalCheckout, ExpressCheckout, PaymentCountdown, TodaPayCheckout, WalletPayment, OmariCheckout, InnBucksCheckout } from "@/components/checkout";
import { AgentPaymentOptions, AgentPaymentMethod } from "@/components/agent/AgentPaymentOptions";
import { useAuth } from "@/contexts/AuthContext";
import { useUserWallet } from "@/hooks/useUserWallet";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { SuccessConfetti } from "@/components/ui/micro-interactions";
import { cn } from "@/lib/utils";
import { BookingProgressStepper } from "@/components/booking/BookingProgressStepper";
import { PaymentMethodsSkeleton } from "@/components/booking/BookingCheckoutSkeleton";

type PaymentView = 'select' | 'todapay' | 'omari' | 'innbucks' | 'wallet' | 'cash' | 'merchant';

const CashConfirmationView = ({ 
  amount, 
  bookingData, 
  convertPrice, 
  saving, 
  onConfirm, 
  onBack 
}: { 
  amount: number; 
  bookingData: any; 
  convertPrice: (n: number) => string; 
  saving: boolean; 
  onConfirm: () => void; 
  onBack: () => void; 
}) => (
  <motion.div 
    key="cash" 
    initial={{ opacity: 0, x: 20 }} 
    animate={{ opacity: 1, x: 0 }} 
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center">
          <Banknote className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-base">Reserve & Pay Cash</h3>
          <p className="text-xs text-muted-foreground">Pay at the point of service</p>
        </div>
      </div>

      <div className="bg-background rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium truncate ml-4">{bookingData.itemName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Passenger</span>
          <span className="font-medium">{bookingData.passengerName}</span>
        </div>
        <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base">
          <span>Amount Due</span>
          <span className="text-primary">{convertPrice(amount)}</span>
        </div>
      </div>

      <Alert className="border-amber-300 dark:border-amber-700 bg-amber-100/50 dark:bg-amber-900/20">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
          Your booking will be reserved for <strong>24 hours</strong>. Visit the merchant or agent to complete cash payment before the deadline to avoid cancellation.
        </AlertDescription>
      </Alert>
    </div>

    <Button 
      onClick={onConfirm} 
      disabled={saving}
      className="w-full rounded-2xl h-12 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
    >
      {saving ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reserving...</>
      ) : (
        <><Banknote className="w-4 h-4 mr-2" />Confirm Cash Reservation</>
      )}
    </Button>

    <button onClick={onBack} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
      ← Choose another method
    </button>
  </motion.div>
);

const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { convertPrice } = useCurrency();
  const { addNotification } = useNotifications();
  const { clearAgentBooking } = useAgentBooking();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [summaryExpanded, setSummaryExpanded] = useState(!isMobile);
  const { balance: walletBalance } = useUserWallet();

  const bookingData = (() => {
    if (location.state) {
      sessionStorage.setItem('pendingBooking', JSON.stringify(location.state));
      return location.state;
    }
    const stored = sessionStorage.getItem('pendingBooking');
    return stored ? JSON.parse(stored) : null;
  })();

  const [showTicket, setShowTicket] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<MerchantPaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [merchantProfileId, setMerchantProfileId] = useState<string | null>(null);
  const [agentPaymentMethod, setAgentPaymentMethod] = useState<AgentPaymentMethod>('agent_retains');
  const [agentRemittanceAmount, setAgentRemittanceAmount] = useState(0);
  const [merchantAllowsCommissionDeduction, setMerchantAllowsCommissionDeduction] = useState(true);
  const [paymentView, setPaymentView] = useState<PaymentView>('select');

  useEffect(() => {
    if (bookingData) {
      if (bookingData.preConfirmed) {
        setBookingReference(bookingData.bookingReference || "");
        setTicketNumber(generateTicketNumber());
        setShowTicket(true);
        sessionStorage.removeItem('pendingBooking');
        return;
      }
      // If merchantProfileId is already provided in bookingData, use it directly
      if (bookingData.merchantProfileId) {
        setMerchantProfileId(bookingData.merchantProfileId);
        loadPaymentMethodsForMerchant(bookingData.merchantProfileId);
      } else {
        loadPaymentMethods();
      }
    }
  }, [bookingData]);

  if (!bookingData) {
    navigate("/");
    return null;
  }

  const loadPaymentMethodsForMerchant = async (merchantId: string) => {
    try {
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchant_profiles')
        .select('id, agent_commission_model, allow_agent_commission_deduction')
        .eq('id', merchantId)
        .eq('verification_status', 'verified')
        .single();

      if (merchantData) {
        setMerchantAllowsCommissionDeduction(merchantData.allow_agent_commission_deduction ?? true);
        const methods = await getMerchantPaymentMethods(merchantData.id);
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error("Error loading payment methods for merchant:", error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchant_profiles')
        .select('id, agent_commission_model, allow_agent_commission_deduction')
        .ilike('business_name', `%${bookingData.operator}%`)
        .eq('verification_status', 'verified')
        .single();

      if (merchantData) {
        setMerchantProfileId(merchantData.id);
        setMerchantAllowsCommissionDeduction(merchantData.allow_agent_commission_deduction ?? true);
        const methods = await getMerchantPaymentMethods(merchantData.id);
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const generateTicketNumber = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const date = now.toISOString().split('T')[0].replace(/-/g, '');
    const time = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const busCode = bookingData.itemId?.toUpperCase().slice(0, 4) || 'BOOK';
    const seatNumber = bookingData.selectedSeats?.[0] || '01';
    return `TKT${day}/${date}/${time}/${busCode}/${seatNumber}`;
  };

  const bookingTimestamp = formatTimestamp(new Date());

  const handlePaymentMethodSelect = async (methodType: string, paymentData: any) => {
    if (methodType === 'payment_gateway') {
      setPaymentView('todapay');
      return;
    }
    await handleConfirm(methodType, paymentData);
  };

  const prepareTodaPayPayment = async () => {
    if (bookingId) {
      return {
        bookingId,
        merchantProfileId,
        merchantReference: bookingId,
        customer: {
          email: bookingData.passengerEmail,
          phoneNumber: bookingData.passengerPhone,
          name: bookingData.passengerName,
        },
      };
    }

    setSaving(true);
    const generatedTicketNumber = generateTicketNumber();
    // For online payment prep, use 'paid' reservation_type (payment_status will be 'pending')
    const pendingBookingData = { ...bookingData, reservationType: 'paid' };
    let data, error, ref;

    try {
      if (bookingData.isAgentBooking && bookingData.agentProfileId) {
        const agentBookingResult = await createAgentBooking(
          { ...pendingBookingData, agentProfileId: bookingData.agentProfileId, agentCommissionRate: bookingData.agentCommissionRate, client: bookingData.agentClient },
          generatedTicketNumber
        );
        data = agentBookingResult.data;
        error = agentBookingResult.error;
        ref = agentBookingResult.bookingReference;
      } else {
        const bookingResult = await createBooking(pendingBookingData, generatedTicketNumber);
        data = bookingResult.data;
        error = bookingResult.error;
        ref = bookingResult.bookingReference;
      }

      if (error || !data?.id) {
        console.error('Booking creation error:', error);
        setSaving(false);
        toast({
          title: "Booking Error",
          description: error?.message || "Unable to create booking. Please try again.",
          variant: "destructive",
        });
        throw new Error(error?.message || 'Unable to prepare booking for payment');
      }
    } catch (err) {
      console.error('Error preparing payment:', err);
      setSaving(false);
      toast({
        title: "Payment Preparation Failed",
        description: "There was an error preparing your booking. Please try again.",
        variant: "destructive",
      });
      throw err;
    }

    if (bookingData.type === "bus" && bookingData.selectedSeatIds) {
      await bookSeats(bookingData.scheduleId, bookingData.selectedSeatIds, data.id);
    }

    if (bookingData.type === "event" && bookingData.selectedSeatIds && bookingData.itemId) {
      await bookEventSeats({
        eventId: bookingData.itemId,
        seatIds: bookingData.selectedSeatIds,
        bookingId: data.id,
      });
    }

    if (merchantProfileId) {
      const feeData = await calculatePlatformFee(merchantProfileId, bookingData.totalPrice, data.id);
      await createTransaction(data.id, merchantProfileId, bookingData.totalPrice, 'payment_gateway', feeData.feePercentage, feeData.feeAmount, {
        gateway: 'toda_pay',
        bookedByAgentId: bookingData.agentProfileId,
        agentCommissionDeducted: agentPaymentMethod === 'agent_retains',
        agentRemittanceAmount,
        agentPaymentMethod,
      }, bookingData.serviceFee || 0);
    }

    setTicketNumber(generatedTicketNumber);
    setBookingReference(ref || '');
    setBookingId(data.id);
    setSaving(false);

    return {
      bookingId: data.id,
      merchantProfileId,
      merchantReference: data.id,
      customer: {
        email: bookingData.passengerEmail,
        phoneNumber: bookingData.passengerPhone,
        name: bookingData.passengerName,
      },
    };
  };

  const handleConfirm = async (methodType?: string, paymentData?: any) => {
    const isCashPayment = methodType === 'cash';
    const isCashReservation = bookingData.reservationType === 'cash_reserved' || isCashPayment;
    
    // For cash payments, set reservation metadata
    if (isCashPayment) {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      bookingData.reservationType = 'cash_reserved';
      bookingData.reservationExpiresAt = deadline.toISOString();
    }
    
    if (!isCashReservation && !methodType && paymentMethods.length > 0) {
      toast({ title: "Payment Method Required", description: "Please select a payment method to continue", variant: "destructive" });
      return;
    }

    setSaving(true);
    const generatedTicketNumber = generateTicketNumber();
    let data, error, ref;
    
    if (bookingData.isAgentBooking && bookingData.agentProfileId) {
      const agentBookingResult = await createAgentBooking(
        { ...bookingData, agentProfileId: bookingData.agentProfileId, agentCommissionRate: bookingData.agentCommissionRate, client: bookingData.agentClient },
        generatedTicketNumber
      );
      data = agentBookingResult.data;
      error = agentBookingResult.error;
      ref = agentBookingResult.bookingReference;
    } else {
      const bookingResult = await createBooking(bookingData, generatedTicketNumber);
      data = bookingResult.data;
      error = bookingResult.error;
      ref = bookingResult.bookingReference;
    }

    if (error) {
      toast({ title: "Booking Failed", description: "Unable to save your booking. Please try again.", variant: "destructive" });
      setSaving(false);
      return;
    }

    if (bookingData.type === "bus" && bookingData.selectedSeatIds && data?.id) {
      await bookSeats(bookingData.scheduleId, bookingData.selectedSeatIds, data.id);
    }

    if (bookingData.type === "event" && bookingData.selectedSeatIds && bookingData.itemId && data?.id) {
      await bookEventSeats({
        eventId: bookingData.itemId,
        seatIds: bookingData.selectedSeatIds,
        bookingId: data.id,
      });
    }

    if (merchantProfileId && methodType && data?.id) {
      try {
        const feeData = await calculatePlatformFee(merchantProfileId, bookingData.totalPrice, data.id);
        let proofUrl;
        if (methodType === "bank_transfer" && paymentData?.paymentProof) {
          proofUrl = await uploadPaymentProof(data.id, paymentData.paymentProof);
        }
        const paymentStatus = methodType === "payment_gateway" ? "completed" : methodType === "bank_transfer" ? "pending_verification" : methodType === "mobile_money" ? "pending_verification" : methodType === "cash" ? "cash_pending" : "pending";
        const serviceFeeAmount = bookingData.serviceFee || 0;
        const transaction = await createTransaction(data.id, merchantProfileId, bookingData.totalPrice, methodType, feeData.feePercentage, feeData.feeAmount, {
          transactionRef: paymentData?.transactionRef,
          paymentProofUrl: proofUrl,
          configuration: paymentData?.configuration,
          bookedByAgentId: bookingData.agentProfileId,
          agentCommissionDeducted: agentPaymentMethod === 'agent_retains',
          agentRemittanceAmount,
          agentPaymentMethod,
        }, serviceFeeAmount);

        if (bookingData.isAgentBooking && agentPaymentMethod === 'agent_retains' && bookingData.agentProfileId) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 7);
          await agentRemittanceService.createRemittanceRecord(bookingData.agentProfileId, data.id, transaction.id, agentRemittanceAmount, methodType, undefined, dueDate);
        }
      } catch (error) {
        console.error("Error creating transaction:", error);
      }
    }

    setTicketNumber(generatedTicketNumber);
    setBookingReference(ref || "");
    setBookingId(data?.id || "");
    setShowTicket(true);
    setSaving(false);
    sessionStorage.removeItem('pendingBooking');
    
    if (bookingData.isAgentBooking) clearAgentBooking();
    
    const isCashMethod = methodType === 'cash';
    toast({ 
      title: isCashMethod ? "Booking Reserved!" : "Payment Successful!", 
      description: isCashMethod 
        ? `Pay cash within 24 hours. Ref: ${ref}` 
        : bookingData.isAgentBooking 
          ? `Booking confirmed for ${bookingData.agentClient?.client_name}!` 
          : `Your booking reference is ${ref}` 
    });
    
    const notifMessage = bookingData.type === 'bus'
      ? `${bookingData.from} → ${bookingData.to} on ${bookingData.date}. Ref: ${ref}`
      : bookingData.type === 'event'
      ? `${bookingData.itemName} on ${bookingData.date || bookingData.eventDate}. Ref: ${ref}`
      : bookingData.type === 'stay'
      ? `${bookingData.itemName} — ${bookingData.checkInDate} to ${bookingData.checkOutDate}. Ref: ${ref}`
      : bookingData.type === 'workspace'
      ? `${bookingData.itemName} booked. Ref: ${ref}`
      : `${bookingData.itemName} confirmed. Ref: ${ref}`;

    addNotification("success", `🎉 Booking Confirmed`, notifMessage, {
      category: 'booking', actionUrl: `/orders`,
      metadata: { bookingRef: ref, amount: bookingData.totalPrice, eventName: bookingData.itemName, routeFrom: bookingData.from, routeTo: bookingData.to, travelDate: bookingData.date || bookingData.eventDate || bookingData.checkInDate },
    });
    addNotification("success", `✅ Payment Received`, `Payment of ${convertPrice(bookingData.totalPrice)} processed successfully for booking ${ref}.`, {
      category: 'payment', actionUrl: `/orders`, metadata: { bookingRef: ref, amount: bookingData.totalPrice },
    });
  };

  const handleDownloadPDF = async () => {
    const pdfData = {
      bookingReference, ticketNumber, itemName: bookingData.itemName,
      passengerName: bookingData.passengerName, passengerEmail: bookingData.passengerEmail,
      passengerPhone: bookingData.passengerPhone, totalPrice: bookingData.totalPrice, currency: 'ZAR', type: bookingData.type,
      ...(bookingData.type === 'bus' && { from: bookingData.from, to: bookingData.to, date: bookingData.date, departureTime: bookingData.departureTime, arrivalTime: bookingData.arrivalTime, selectedSeats: bookingData.selectedSeats, operator: bookingData.operator }),
      ...(bookingData.type === 'stay' && { checkInDate: bookingData.checkInDate, checkOutDate: bookingData.checkOutDate, propertyCity: bookingData.propertyCity, roomName: bookingData.roomName, numGuests: bookingData.numGuests, numRooms: bookingData.numRooms }),
      ...(bookingData.type === 'event' && { eventDate: bookingData.date || bookingData.eventDate, eventTime: bookingData.eventTime, eventVenue: bookingData.to || bookingData.venue, ticketQuantity: bookingData.ticketQuantity }),
    };
    await generateEnhancedPDF(pdfData);
    toast({ title: "PDF Generated!", description: "Your ticket has been downloaded" });
  };

  const handleDownloadWallet = async () => {
    const result = await downloadWalletPass({
      bookingReference, ticketNumber, itemName: bookingData.itemName,
      passengerName: bookingData.passengerName, passengerEmail: bookingData.passengerEmail,
      passengerPhone: bookingData.passengerPhone, type: bookingData.type as 'bus' | 'event' | 'stay',
      from: bookingData.from, to: bookingData.to, date: bookingData.date, departureTime: bookingData.departureTime,
      eventDate: bookingData.eventDate || bookingData.date, eventTime: bookingData.eventTime || bookingData.departureTime,
      eventVenue: bookingData.venue || bookingData.to, seats: bookingData.selectedSeats,
      checkInDate: bookingData.checkInDate, checkOutDate: bookingData.checkOutDate, propertyCity: bookingData.propertyCity,
    });
    toast({ title: result.success ? "Wallet Pass Ready" : "Wallet Pass Info", description: result.message || "Pass data generated" });
  };

  // Success Screen Component
  const SuccessScreen = ({ ticketComponent, type }: { ticketComponent: React.ReactNode; type: string }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    useEffect(() => {
      if ('vibrate' in navigator) navigator.vibrate([30, 50, 30]);
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1500);
      return () => clearTimeout(t);
    }, []);

    return (
    <MobileAppLayout pageTitle="Booking Confirmed">
      <div className="relative">
        <SuccessConfetti show={showConfetti} />
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background border-b safe-area-pt px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <motion.div className="absolute inset-0 rounded-full bg-primary" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }} />
            <motion.div className="absolute inset-0 rounded-full border-2 border-primary/30" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ duration: 0.8, delay: 0.2 }} />
            <motion.div className="absolute inset-0 rounded-full border-2 border-primary/20" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 1, delay: 0.3 }} />
            <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 }}>
              <CheckCircle className="w-6 h-6 text-primary-foreground" />
            </motion.div>
          </div>
          <div>
            <h1 className="font-bold text-lg">Booking Confirmed!</h1>
            <p className="text-xs text-muted-foreground">Ref: {bookingReference}</p>
          </div>
        </div>
      </motion.header>

      <main className="px-4 py-6 space-y-6">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <BookingProgressStepper currentStep={5} steps={["Search", "Select", "Details", "Payment", "Done"]} />
        </motion.div>
        {bookingData.isAgentBooking && bookingData.agentCommissionRate && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Card className="rounded-3xl overflow-hidden border-0 shadow-lg bg-primary text-primary-foreground p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                <div>
                  <div className="text-2xl font-bold">{convertPrice(bookingData.totalPrice * (bookingData.agentCommissionRate / 100))}</div>
                  <div className="text-sm opacity-90">Your {bookingData.agentCommissionRate}% commission</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Alert className="rounded-2xl bg-primary/5 border-primary/20">
            <Info className="h-5 w-5 text-primary" />
            <AlertDescription>
              <p className="font-semibold">Save this reference</p>
              <p className="text-sm text-muted-foreground">Use code <span className="font-mono font-bold">{bookingReference}</span> to retrieve your booking anytime</p>
            </AlertDescription>
          </Alert>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          {ticketComponent}
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-3">
          {bookingData.isAgentBooking ? (
            <Button variant="outline" onClick={() => navigate("/merchant/agent")} className="w-full rounded-full h-12">Back to Agent Dashboard</Button>
          ) : !user ? (
            <>
              <AccountBenefitsCard passengerEmail={bookingData.passengerEmail} bookingReference={bookingReference} />
              <Button variant="outline" onClick={() => navigate("/")} className="w-full rounded-full h-12">Back to Home</Button>
            </>
          ) : (
            <div className="space-y-3">
              {bookingData.type === 'event' && (
                <Card className="p-4 bg-primary/5 border-primary/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-semibold text-sm">Invite friends to this event</h4>
                      <p className="text-xs text-muted-foreground">Share the event and go together!</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full rounded-full h-10 text-sm gap-2 press-effect"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/events/${bookingData.itemId}`;
                      if (navigator.share) {
                        navigator.share({ title: `Join me at ${bookingData.itemName}!`, text: `I just got tickets to ${bookingData.itemName}. Get yours too!`, url: shareUrl });
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        toast({ title: "Link copied!", description: "Share it with your friends" });
                      }
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />Share Event Link
                  </Button>
                </Card>
              )}
              <Button onClick={() => navigate("/orders")} className="w-full rounded-full h-12">View My Orders</Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full rounded-full h-12">Back to Home</Button>
            </div>
          )}
        </motion.div>
      </main>
      </div>
    </MobileAppLayout>
    );
  };

  // Render ticket screens for different booking types
  if (showTicket && bookingData.type === "bus") {
    return <SuccessScreen type="bus" ticketComponent={<WorldClassBusTicket bookingData={bookingData} ticketNumber={ticketNumber} bookingReference={bookingReference} reservationType={bookingData.reservationType} onDownloadPDF={handleDownloadPDF} onDownloadWallet={handleDownloadWallet} />} />;
  }
  if (showTicket && bookingData.type === "event") {
    return <SuccessScreen type="event" ticketComponent={<WorldClassEventTicket booking={{ id: bookingId, booking_reference: bookingReference, ticket_number: ticketNumber, item_name: bookingData.itemName, event_date: bookingData.date || bookingData.eventDate || "", event_time: bookingData.eventTime || bookingData.departureTime || "", event_venue: bookingData.to || bookingData.venue || "", event_category: bookingData.eventCategory || "", ticket_quantity: bookingData.ticketQuantity || 1, selected_seats: bookingData.selectedSeats || [], passenger_name: bookingData.passengerName, passenger_email: bookingData.passengerEmail, total_price: bookingData.totalPrice, status: "confirmed" }} onDownloadPDF={handleDownloadPDF} onDownloadWallet={handleDownloadWallet} />} />;
  }
  if (showTicket && bookingData.type === "stay") {
    return <SuccessScreen type="stay" ticketComponent={<WorldClassStayTicket booking={{ id: bookingId, booking_reference: bookingReference, ticket_number: ticketNumber, item_name: bookingData.itemName, check_in_date: bookingData.checkInDate || "", check_out_date: bookingData.checkOutDate || "", property_city: bookingData.propertyCity || bookingData.to || "", room_name: bookingData.roomName || "", num_guests: bookingData.numGuests || 1, num_rooms: bookingData.numRooms || 1, passenger_name: bookingData.passengerName, passenger_email: bookingData.passengerEmail, total_price: bookingData.totalPrice, status: "confirmed", reservation_type: bookingData.reservationType }} onDownloadPDF={handleDownloadPDF} onDownloadWallet={handleDownloadWallet} />} />;
  }
  if (showTicket && bookingData.type === "workspace") {
    return <SuccessScreen type="workspace" ticketComponent={<WorldClassWorkspaceTicket booking={{ id: bookingId, booking_reference: bookingReference, ticket_number: ticketNumber, booking_type: "workspace" as const, item_name: bookingData.itemName, start_datetime: bookingData.startDatetime || "", end_datetime: bookingData.endDatetime || "", workspace_city: bookingData.workspaceCity || bookingData.to || "", workspace_type: bookingData.workspaceType || "meeting_room", num_attendees: bookingData.numAttendees || 1, passenger_name: bookingData.passengerName, passenger_email: bookingData.passengerEmail, total_price: bookingData.totalPrice, status: "confirmed", equipment_requested: bookingData.equipment || [], catering_requested: bookingData.catering || [] }} onDownloadPDF={handleDownloadPDF} onDownloadWallet={handleDownloadWallet} />} />;
  }
  if (showTicket && bookingData.type === "experience") {
    return <SuccessScreen type="experience" ticketComponent={<WorldClassExperienceTicket booking={{ id: bookingId, booking_reference: bookingReference, ticket_number: ticketNumber, item_name: bookingData.itemName, experience_type: bookingData.experienceType || "", experience_date: bookingData.experienceDate || bookingData.date || "", start_time: bookingData.experienceTime || bookingData.departureTime || "", duration_hours: bookingData.durationHours, meeting_point: bookingData.meetingPoint || bookingData.venue || "", location_city: bookingData.to || "", num_participants: bookingData.numberOfGuests || bookingData.ticketQuantity || 1, guide_name: bookingData.hostName, passenger_name: bookingData.passengerName, passenger_email: bookingData.passengerEmail, passenger_phone: bookingData.passengerPhone, total_price: bookingData.totalPrice, status: "confirmed" }} onDownloadPDF={handleDownloadPDF} onDownloadWallet={handleDownloadWallet} />} />;
  }
  if (showTicket && bookingData.type === "transfer") {
    return <SuccessScreen type="transfer" ticketComponent={<WorldClassTransferTicket booking={{ id: bookingId, booking_reference: bookingReference, ticket_number: ticketNumber, service_name: bookingData.itemName || "Transfer Service", pickup_location: bookingData.from || bookingData.pickupLocation || "", dropoff_location: bookingData.to || bookingData.dropoffLocation || "", pickup_datetime: bookingData.transferDate ? `${bookingData.transferDate}T${bookingData.transferTime || '00:00'}` : "", flight_number: bookingData.flightNumber, vehicle_type: bookingData.vehicleType, num_passengers: bookingData.passengers || 1, num_luggage: bookingData.luggage, driver_name: bookingData.driverName, passenger_name: bookingData.passengerName, passenger_email: bookingData.passengerEmail, passenger_phone: bookingData.passengerPhone, total_price: bookingData.totalPrice, status: "confirmed" }} onDownloadPDF={handleDownloadPDF} onDownloadWallet={handleDownloadWallet} />} />;
  }
  if (showTicket && (bookingData.type === "car" || bookingData.type === "car_rental")) {
    return <SuccessScreen type="car" ticketComponent={<WorldClassCarRentalTicket booking={{ id: bookingId, booking_reference: bookingReference, ticket_number: ticketNumber, vehicle_name: bookingData.vehicleInfo || bookingData.itemName, vehicle_type: bookingData.vehicleType, pickup_location: bookingData.pickupLocation || bookingData.from || "", dropoff_location: bookingData.returnLocation || bookingData.pickupLocation || bookingData.from || "", pickup_datetime: bookingData.pickupDate || "", dropoff_datetime: bookingData.returnDate || "", driver_name: bookingData.passengerName, driver_email: bookingData.passengerEmail, driver_phone: bookingData.passengerPhone, total_price: bookingData.totalPrice, status: "confirmed" }} onDownloadPDF={handleDownloadPDF} onDownloadWallet={handleDownloadWallet} />} />;
  }
  if (showTicket && bookingData.type === "venue") {
    return <SuccessScreen type="venue" ticketComponent={<WorldClassVenueTicket booking={{ id: bookingId, booking_reference: bookingReference, ticket_number: ticketNumber, venue_name: bookingData.itemName, venue_type: bookingData.venueType, venue_address: bookingData.venue || bookingData.propertyAddress, venue_city: bookingData.to || "", start_datetime: bookingData.startDatetime || bookingData.date || "", end_datetime: bookingData.endDatetime || "", event_type: bookingData.eventType, num_attendees: bookingData.numAttendees || bookingData.numberOfGuests || 1, passenger_name: bookingData.passengerName, passenger_email: bookingData.passengerEmail, passenger_phone: bookingData.passengerPhone, total_price: bookingData.totalPrice, status: "confirmed" }} onDownloadPDF={handleDownloadPDF} onDownloadWallet={handleDownloadWallet} />} />;
  }
  if (showTicket) {
    return (
      <SuccessScreen type={bookingData.type} ticketComponent={
        <Card className="rounded-3xl overflow-hidden border-0 shadow-lg p-6 space-y-4">
          <div className="text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <h2 className="font-bold text-xl">Booking Confirmed!</h2>
            <p className="text-muted-foreground">{bookingData.itemName}</p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reference</span><span className="font-mono font-bold">{bookingReference}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ticket</span><span className="font-mono">{ticketNumber}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Passenger</span><span>{bookingData.passengerName}</span></div>
            <div className="flex justify-between font-semibold border-t pt-2 mt-2"><span>Total</span><span className="text-primary">{convertPrice(bookingData.totalPrice)}</span></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" className="flex-1 rounded-full"><Info className="w-4 h-4 mr-2" />PDF</Button>
          </div>
        </Card>
      } />
    );
  }

  const totalAmount = bookingData.totalPrice + (bookingData.serviceFee || 0);

  // Payment method tiles data
  const paymentTiles = [
    {
      id: 'todapay' as PaymentView,
      label: 'TodaPay',
      subtitle: 'Card · Mobile · Bank',
      icon: <CreditCard className="w-5 h-5" />,
      gradient: 'from-primary to-primary-dark',
      textColor: 'text-primary-foreground',
      badge: 'Recommended',
      badgeColor: 'bg-primary-foreground/20 text-primary-foreground',
    },
    {
      id: 'omari' as PaymentView,
      label: "O'mari",
      subtitle: 'Old Mutual',
      icon: <img src={omariLogo} alt="" className="w-5 h-5 object-contain" />,
      gradient: 'from-emerald-600 to-emerald-700',
      textColor: 'text-white',
      badge: null,
      badgeColor: '',
    },
    {
      id: 'innbucks' as PaymentView,
      label: 'InnBucks',
      subtitle: 'Scan & Pay',
      icon: <img src={innbucksLogo} alt="" className="w-5 h-5 object-contain" />,
      gradient: 'from-[#00A651] to-[#008C44]',
      textColor: 'text-white',
      badge: null,
      badgeColor: '',
    },
  ];

  // For agent bookings, promote cash into primary tiles
  const agentCashTile = bookingData.isAgentBooking ? {
    id: 'cash' as PaymentView,
    label: 'Cash Collection',
    subtitle: 'Collect & Remit',
    icon: <Banknote className="w-5 h-5" />,
    gradient: 'from-amber-500 to-amber-600',
    textColor: 'text-white',
    badge: 'Agent',
    badgeColor: 'bg-white/20 text-white',
  } : null;

  const finalPaymentTiles = agentCashTile ? [...paymentTiles, agentCashTile] : paymentTiles;

  const secondaryMethods = [
    ...(user ? [{
      id: 'wallet' as PaymentView,
      label: 'Wallet',
      icon: <Wallet className="w-4 h-4" />,
      balance: walletBalance,
    }] : []),
    ...(!bookingData.isAgentBooking ? [{
      id: 'cash' as PaymentView,
      label: 'Cash',
      icon: <Banknote className="w-4 h-4" />,
    }] : []),
    ...(paymentMethods.length > 0 ? [{
      id: 'merchant' as PaymentView,
      label: 'More',
      icon: <Smartphone className="w-4 h-4" />,
    }] : []),
  ];

  // Main Checkout Screen
  return (
    <MobileAppLayout hideNav pageTitle="Confirm Booking">
      {/* Minimal header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 safe-area-pt px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <BackButton fallbackPath="/" />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base truncate">{bookingData.itemName}</h1>
            <p className="text-xs text-muted-foreground">{bookingTimestamp}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full shrink-0">
            <Lock className="w-3 h-3" />
            <span className="text-[10px] font-semibold tracking-wide">SECURE</span>
          </div>
        </div>
      </motion.header>

      <main className="px-4 py-5 space-y-5 pb-32 md:pb-8">
        {/* Progress */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <BookingProgressStepper currentStep={4} steps={["Search", "Select", "Details", "Payment", "Done"]} />
        </motion.div>

        {/* Guest/Agent Info */}
        {!bookingData.isAgentBooking && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-primary/5 border border-primary/10">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-foreground"><span className="font-semibold">Guest checkout</span> — Ticket sent to {bookingData.passengerEmail}</p>
            </div>
          </motion.div>
        )}

        {bookingData.isAgentBooking && bookingData.agentClient && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><UserPlus className="w-5 h-5 text-primary" /></div>
                <div>
                  <h3 className="font-semibold text-sm">Agent Booking</h3>
                  <p className="text-xs text-muted-foreground">For {bookingData.agentClient.client_name}</p>
                </div>
              </div>
              <div className="bg-primary/10 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-primary font-medium">Commission</span>
                <span className="font-bold text-sm text-primary">{convertPrice(bookingData.totalPrice * (bookingData.agentCommissionRate / 100))} ({bookingData.agentCommissionRate}%)</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── HERO AMOUNT CARD ─── */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.05 }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground via-foreground to-foreground/90 p-5 text-background">
            {/* Decorative circles */}
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/20 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary/15 blur-xl" />
            
            <div className="relative z-10">
              {/* Amount */}
              <div className="text-center mb-4">
                <p className="text-xs opacity-60 mb-1 uppercase tracking-widest font-medium">Total Due</p>
                <motion.div 
                  className="text-4xl md:text-5xl font-black tracking-tight"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
                >
                  {convertPrice(totalAmount)}
                </motion.div>
              </div>

              {/* Compact summary */}
              <button 
                className="w-full"
                onClick={() => isMobile && setSummaryExpanded(!summaryExpanded)}
              >
                <div className="flex items-center justify-between bg-background/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-background/10 flex items-center justify-center shrink-0">
                      {bookingData.type === "bus" ? <MapPin className="w-4 h-4" /> :
                       bookingData.type === "event" ? <Ticket className="w-4 h-4" /> :
                       bookingData.type === "stay" ? <Calendar className="w-4 h-4" /> :
                       <CreditCard className="w-4 h-4" />}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold truncate">{bookingData.itemName}</p>
                      <p className="text-xs opacity-60 truncate">
                        {bookingData.type === "bus" ? `${bookingData.from} → ${bookingData.to}` :
                         bookingData.type === "event" ? `${bookingData.date || bookingData.eventDate}` :
                         bookingData.type === "stay" ? `${bookingData.checkInDate} → ${bookingData.checkOutDate}` :
                         bookingData.passengerName}
                      </p>
                    </div>
                  </div>
                  {isMobile && (
                    <motion.div animate={{ rotate: summaryExpanded ? 180 : 0 }}>
                      <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
                    </motion.div>
                  )}
                </div>
              </button>

              {/* Expandable details */}
              <AnimatePresence>
                {(summaryExpanded || !isMobile) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2">
                      {bookingData.type === "bus" && (
                        <>
                          <div className="flex justify-between text-xs opacity-70">
                            <span>Route</span>
                            <span>{bookingData.from} → {bookingData.to}</span>
                          </div>
                          <div className="flex justify-between text-xs opacity-70">
                            <span>Date</span>
                            <span>{bookingData.date} · {bookingData.departureTime}</span>
                          </div>
                          {bookingData.selectedSeats && (
                            <div className="flex justify-between text-xs opacity-70">
                              <span>Seats</span>
                              <span>{bookingData.selectedSeats.join(", ")}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between text-xs opacity-70">
                        <span>Passenger</span>
                        <span>{bookingData.passengerName}</span>
                      </div>
                      <div className="flex justify-between text-xs opacity-70">
                        <span>Email</span>
                        <span className="truncate ml-4">{bookingData.passengerEmail}</span>
                      </div>
                      {(bookingData.serviceFee > 0) && (
                        <>
                          <div className="border-t border-background/10 pt-2 mt-2 flex justify-between text-xs opacity-70">
                            <span>Subtotal</span>
                            <span>{convertPrice(bookingData.totalPrice)}</span>
                          </div>
                          <div className="flex justify-between text-xs opacity-70">
                            <span>Service fee</span>
                            <span>{convertPrice(bookingData.serviceFee)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ─── PAYMENT METHODS ─── */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.15 }}
        >
          {bookingData.isAgentBooking && (
            <div className="mb-4">
              <AgentPaymentOptions
                totalAmount={bookingData.totalPrice}
                commissionRate={bookingData.agentCommissionRate || 10}
                onMethodChange={(method, remittance) => { setAgentPaymentMethod(method); setAgentRemittanceAmount(remittance); }}
                merchantAllowsCommissionDeduction={merchantAllowsCommissionDeduction}
              />
            </div>
          )}

          {loadingMethods ? (
            <PaymentMethodsSkeleton />
          ) : (
            <AnimatePresence mode="wait">
              {paymentView === 'select' ? (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Choose payment</p>

                  {/* Primary payment tiles */}
                  <div className={cn("grid gap-2.5", finalPaymentTiles.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
                    {finalPaymentTiles.map((tile, i) => (
                      <motion.button
                        key={tile.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        onClick={() => setPaymentView(tile.id)}
                        className={cn(
                          "relative group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl glow-border",
                          `bg-gradient-to-br ${tile.gradient} ${tile.textColor}`,
                          "shadow-lg hover:shadow-xl active:scale-[0.97] transition-all duration-200",
                          "min-h-[100px]"
                        )}
                      >
                        {tile.badge && (
                          <span className={cn(
                            "absolute -top-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full",
                            tile.badgeColor
                          )}>
                            {tile.badge}
                          </span>
                        )}
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                          {tile.icon}
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold leading-tight">{tile.label}</p>
                          <p className="text-[9px] opacity-70 mt-0.5">{tile.subtitle}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Secondary methods strip */}
                  {secondaryMethods.length > 0 && (
                    <>
                      <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                        <div className="relative flex justify-center"><span className="bg-background px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">or</span></div>
                      </div>
                      <div className="flex gap-2">
                        {secondaryMethods.map((m, i) => (
                          <motion.button
                            key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + 0.05 * i }}
                            onClick={() => setPaymentView(m.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/50 active:scale-[0.97] transition-all"
                          >
                            <span className="text-muted-foreground">{m.icon}</span>
                            <span className="text-xs font-semibold">{m.label}</span>
                            {'balance' in m && typeof m.balance === 'number' && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                ({convertPrice(m.balance)})
                              </span>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Trust strip */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      <span>256-bit SSL</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CheckCircle className="w-3 h-3" />
                      <span>Instant confirm</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      <span>PCI Compliant</span>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground/50">
                    Powered by <span className="font-semibold text-muted-foreground/70">TodaPay</span> · Toda Technologies
                  </p>
                </motion.div>
              ) : paymentView === 'todapay' ? (
                <motion.div key="todapay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <TodaPayCheckout amount={totalAmount} reason={`${bookingData.itemName}${bookingData.from ? ` - ${bookingData.from} to ${bookingData.to}` : ''}`} bookingId={bookingId || undefined} merchantProfileId={merchantProfileId || undefined} preparePayment={prepareTodaPayPayment} onCancel={() => setPaymentView('select')} onPaymentComplete={(data) => handleConfirm('payment_gateway', data)} />
                </motion.div>
              ) : paymentView === 'omari' ? (
                <motion.div key="omari" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <OmariCheckout amount={totalAmount} reference={bookingId || bookingData.itemName} currency="USD" description={`${bookingData.itemName}${bookingData.from ? ` · ${bookingData.from} → ${bookingData.to}` : ''}`} onCancel={() => setPaymentView('select')} onSuccess={(data) => handleConfirm('omari', data)} />
                </motion.div>
              ) : paymentView === 'innbucks' ? (
                <motion.div key="innbucks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <InnBucksCheckout amount={totalAmount} reference={bookingId || bookingData.itemName} currency="USD" description={`${bookingData.itemName}${bookingData.from ? ` · ${bookingData.from} → ${bookingData.to}` : ''}`} onCancel={() => setPaymentView('select')} onSuccess={(data) => handleConfirm('innbucks', data)} />
                </motion.div>
              ) : paymentView === 'cash' ? (
                <CashConfirmationView
                  amount={totalAmount}
                  bookingData={bookingData}
                  convertPrice={convertPrice}
                  saving={saving}
                  onConfirm={() => handleConfirm('cash', { methodType: 'cash' })}
                  onBack={() => setPaymentView('select')}
                />
              ) : paymentView === 'wallet' ? (
                <motion.div key="wallet" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <WalletPayment amount={totalAmount} onPaymentComplete={(data) => handleConfirm('wallet', data)} disabled={saving} />
                  <button onClick={() => setPaymentView('select')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                    ← Choose another method
                  </button>
                </motion.div>
              ) : paymentView === 'merchant' ? (
                <motion.div key="merchant" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <UniversalCheckout
                    merchantProfileId={merchantProfileId}
                    paymentMethods={paymentMethods}
                    bookingData={{ type: bookingData.type, itemName: bookingData.itemName, totalPrice: bookingData.totalPrice, from: bookingData.from, to: bookingData.to, date: bookingData.date, departureTime: bookingData.departureTime, arrivalTime: bookingData.arrivalTime, selectedSeats: bookingData.selectedSeats, operator: bookingData.operator, eventDate: bookingData.eventDate, eventTime: bookingData.eventTime, venue: bookingData.venue, ticketQuantity: bookingData.ticketQuantity, passengerName: bookingData.passengerName, passengerEmail: bookingData.passengerEmail, passengerPhone: bookingData.passengerPhone, reservationType: bookingData.reservationType, reservationExpiresAt: bookingData.reservationExpiresAt }}
                    onPaymentComplete={(paymentData) => handlePaymentMethodSelect(paymentData?.methodType || 'default', paymentData)}
                    isLoading={saving}
                  />
                  <button onClick={() => setPaymentView('select')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                    ← Choose another method
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          )}
        </motion.div>
      </main>

      {/* Mobile sticky bar */}
      {isMobile && paymentView === 'select' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/50 pb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)] md:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">{convertPrice(totalAmount)}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total due</div>
            </div>
            <Button
              onClick={() => setPaymentView('todapay')}
              className="rounded-2xl px-6 h-12 text-sm font-semibold shadow-lg shadow-primary/25"
              disabled={saving}
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />Pay Now
            </Button>
          </div>
        </div>
      )}
    </MobileAppLayout>
  );
};

export default BookingConfirm;
