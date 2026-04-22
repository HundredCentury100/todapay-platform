import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import BusResults from "./pages/BusResults";
import BusDetails from "./pages/BusDetails";
import EventResults from "./pages/EventResults";
import EventDetails from "./pages/EventDetails";
import BookingConfirm from "./pages/BookingConfirm";
import PaymentCallback from "./pages/PaymentCallback";
// BillPayments removed - billers are now embedded in PayPage
import ZesaTokenPurchase from "./pages/bills/ZesaTokenPurchase";
import BCCPayment from "./pages/bills/BCCPayment";
import EconetPayment from "./pages/bills/EconetPayment";
import NetonePayment from "./pages/bills/NetonePayment";
import TelecelPayment from "./pages/bills/TelecelPayment";
import NyaradzoPayment from "./pages/bills/NyaradzoPayment";
import MoonlightPayment from "./pages/bills/MoonlightPayment";
import EdgarsPayment from "./pages/bills/EdgarsPayment";
import JetPayment from "./pages/bills/JetPayment";
import BillHistory from "./pages/bills/BillHistory";
import GiftCards from "./pages/GiftCards";
import GiftCardPurchase from "./pages/GiftCardPurchase";
import GiftCardDetail from "./pages/GiftCardDetail";

import Auth from "./pages/Auth";
import RetrieveBooking from "./pages/RetrieveBooking";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import NotificationSettings from "./pages/NotificationSettings";
import SavedTravelers from "./pages/SavedTravelers";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import CheckInPage from "./pages/CheckInPage";
import SharedTicket from "./pages/SharedTicket";
import VerifyTicket from "./pages/VerifyTicket";
import AgentDiscovery from "./pages/AgentDiscovery";
import RideBooking from "./pages/RideBooking";
import TransferBooking from "./pages/TransferBooking";
import TransferTracking from "./pages/TransferTracking";
import VenueResults from "./pages/VenueResults";
import VenueDetails from "./pages/VenueDetails";
import VenueQuoteCheckout from "./pages/VenueQuoteCheckout";
import StayResults from "./pages/StayResults";
import StayDetails from "./pages/StayDetails";
import WorkspaceResults from "./pages/WorkspaceResults";
import WorkspaceDetails from "./pages/WorkspaceDetails";
import MerchantPortal from "./pages/merchant/MerchantPortal";
import AdminAuth from "./pages/merchant/admin/AdminAuth";
import BusOperatorDashboard from "./pages/merchant/bus-operator/BusOperatorDashboard";
import SchedulesPage from "./pages/merchant/bus-operator/SchedulesPage";
import BusOperatorBookingsPage from "./pages/merchant/bus-operator/BookingsPage";
import BusOperatorRevenuePage from "./pages/merchant/bus-operator/RevenuePage";
import CustomersPage from "./pages/merchant/bus-operator/CustomersPage";
import RoutesPage from "./pages/merchant/bus-operator/RoutesPage";
import BusOperatorAnalyticsPage from "./pages/merchant/bus-operator/AnalyticsPage";
import BusOperatorBookingActionsPage from "./pages/merchant/bus-operator/BookingActionsPage";
import EventOrganizerDashboard from "./pages/merchant/event-organizer/EventOrganizerDashboard";
import EventsPage from "./pages/merchant/event-organizer/EventsPage";
import EventOrganizerRevenuePage from "./pages/merchant/event-organizer/RevenuePage";
import AttendeesPage from "./pages/merchant/event-organizer/AttendeesPage";
import OrganizerCheckInPage from "./pages/merchant/event-organizer/CheckInPage";
import SchoolEventsPage from "./pages/merchant/event-organizer/SchoolEventsPage";
import MarketingPage from "./pages/merchant/event-organizer/MarketingPage";
import EventOrganizerAnalyticsPage from "./pages/merchant/event-organizer/AnalyticsPage";
import EventOrganizerBookingActionsPage from "./pages/merchant/event-organizer/BookingActionsPage";
import EventPricingPage from "./pages/merchant/event-organizer/EventPricingPage";
import EventMessagesPage from "./pages/merchant/event-organizer/EventMessagesPage";
import BusOperatorSettingsPage from "./pages/merchant/bus-operator/SettingsPage";
import BusOperatorReviewsPage from "./pages/merchant/bus-operator/ReviewsPage";
import BusOperatorCheckInPage from "./pages/merchant/bus-operator/CheckInPage";
import ChatbotSettingsPage from "./pages/merchant/bus-operator/ChatbotSettingsPage";
import EventOrganizerSettingsPage from "./pages/merchant/event-organizer/SettingsPage";
import EventOrganizerReviewsPage from "./pages/merchant/event-organizer/ReviewsPage";
import TicketsPage from "./pages/merchant/event-organizer/TicketsPage";
import WaitlistPage from "./pages/merchant/event-organizer/WaitlistPage";
import SeatMapEditorPage from "./pages/merchant/event-organizer/SeatMapEditorPage";
import FestivalSchedulePage from "./pages/merchant/event-organizer/FestivalSchedulePage";
import EventStaffPage from "./pages/merchant/event-organizer/EventStaffPage";
import SponsorsPage from "./pages/merchant/event-organizer/SponsorsPage";
import LiveEventDashboard from "./pages/merchant/event-organizer/LiveEventDashboard";
import PostEventReportPage from "./pages/merchant/event-organizer/PostEventReportPage";
import AdminDashboard from "./pages/merchant/admin/AdminDashboard";
import TransactionMonitoring from "./pages/merchant/admin/TransactionMonitoring";
import AdminAnalytics from "./pages/merchant/admin/AdminAnalytics";
import AdminSettings from "./pages/merchant/admin/AdminSettings";
import CredentialProvisioning from "./pages/merchant/admin/CredentialProvisioning";
import ActivityLogs from "./pages/merchant/admin/ActivityLogs";
import SystemHealth from "./pages/merchant/admin/SystemHealth";
import UserManagement from "./pages/merchant/admin/UserManagement";
import MerchantVerification from "./pages/merchant/admin/MerchantVerification";
import MerchantAnalytics from "./pages/merchant/admin/MerchantAnalytics";
import MerchantSuspension from "./pages/merchant/admin/MerchantSuspension";
import AccountLifecycle from "./pages/merchant/admin/AccountLifecycle";
import AdminBookingDetail from "./pages/merchant/admin/AdminBookingDetail";
import SupportManagement from "./pages/merchant/admin/SupportManagement";
import KYCManagement from "./pages/merchant/admin/KYCManagement";
import MerchantPerformance from "./pages/merchant/admin/MerchantPerformance";
import SupportTickets from "./pages/merchant/SupportTickets";
import PaymentSettingsPage from "./pages/merchant/PaymentSettingsPage";
import TransactionsPage from "./pages/merchant/TransactionsPage";
import PayoutsPage from "./pages/merchant/PayoutsPage";
// Credits system removed - using escrow/payout model
import MerchantProfile from "./pages/merchant/MerchantProfile";
import AgentProfile from "./pages/merchant/AgentProfile";
import AgentVerification from "./pages/merchant/admin/AgentVerification";
import AgentPerformance from "./pages/merchant/admin/AgentPerformance";
import TravelAgentDashboard from "./pages/merchant/agent/TravelAgentDashboard";
import AgentBookingsPage from "./pages/merchant/agent/AgentBookingsPage";
import AgentClientsPage from "./pages/merchant/agent/AgentClientsPage";

import AgentAnalyticsPage from "./pages/merchant/agent/AgentAnalyticsPage";
import AgentSettingsPage from "./pages/merchant/agent/AgentSettingsPage";
import AgentBulkBookingPage from "./pages/merchant/agent/AgentBulkBookingPage";
import SubAgentsPage from "./pages/merchant/agent/SubAgentsPage";
import AgentPaymentsPage from "./pages/merchant/agent/AgentPaymentsPage";
import AgentServiceManagement from "./pages/merchant/agent/AgentServiceManagement";
import AgentMerchantRegistration from "./pages/merchant/agent/AgentMerchantRegistration";
import AgentMerchantManagement from "./pages/merchant/agent/AgentMerchantManagement";
import AgentBillPayPage from "./pages/merchant/agent/AgentBillPayPage";
import AgentBillHistory from "./pages/merchant/agent/AgentBillHistory";
import AgentBillReconciliation from "./pages/merchant/agent/AgentBillReconciliation";
import InnBucksToolsPage from "./pages/merchant/shared/InnBucksToolsPage";
import AdvertisingPage from "./pages/merchant/AdvertisingPage";
import AdManagement from "./pages/merchant/admin/AdManagement";
import PromoManagement from "./pages/merchant/admin/PromoManagement";
import MerchantBillActivity from "./pages/merchant/admin/MerchantBillActivity";
// EcoCash credit verification removed
import AdminAgentFloatManager from "./components/admin/AdminAgentFloatManager";
import RideAnalytics from "./pages/merchant/admin/RideAnalytics";
import VenueOwnerDashboard from "./pages/merchant/venue-owner/VenueOwnerDashboard";
import VenueOwnerVenuesPage from "./pages/merchant/venue-owner/VenuesPage";
import VenueOwnerBookingsPage from "./pages/merchant/venue-owner/BookingsPage";
import VenueOwnerQuotesPage from "./pages/merchant/venue-owner/QuotesPage";
import VenueOwnerAvailabilityPage from "./pages/merchant/venue-owner/AvailabilityPage";
import VenueOwnerRevenuePage from "./pages/merchant/venue-owner/RevenuePage";
import VenueOwnerReviewsPage from "./pages/merchant/venue-owner/ReviewsPage";
import VenueOwnerSettingsPage from "./pages/merchant/venue-owner/SettingsPage";

// Property Owner imports
import PropertyOwnerDashboard from "./pages/merchant/property-owner/PropertyOwnerDashboard";
import PropertyOwnerPropertiesPage from "./pages/merchant/property-owner/PropertiesPage";
import PropertyOwnerRoomsPage from "./pages/merchant/property-owner/RoomsPage";
import PropertyOwnerBookingsPage from "./pages/merchant/property-owner/BookingsPage";
import PropertyOwnerRevenuePage from "./pages/merchant/property-owner/RevenuePage";
import PropertyOwnerAvailabilityPage from "./pages/merchant/property-owner/AvailabilityPage";
import PropertyOwnerReviewsPage from "./pages/merchant/property-owner/ReviewsPage";
import PropertyOwnerSettingsPage from "./pages/merchant/property-owner/SettingsPage";
import PropertyOwnerPricingPage from "./pages/merchant/property-owner/PricingPage";
import PropertyOwnerMessagesPage from "./pages/merchant/property-owner/MessagesPage";

// Airline Partner imports
import AirlineDashboard from "./pages/merchant/airline/AirlineDashboard";
import AirlineFlightsPage from "./pages/merchant/airline/FlightsPage";
import AirlineBookingsPage from "./pages/merchant/airline/AirlineBookingsPage";
import AirlineSettingsPage from "./pages/merchant/airline/AirlineSettingsPage";

// Workspace Provider imports
import WorkspaceDashboard from "./pages/merchant/workspace/WorkspaceDashboard";
import WorkspaceSpacesPage from "./pages/merchant/workspace/SpacesPage";
import WorkspaceBookingsPage from "./pages/merchant/workspace/WorkspaceBookingsPage";
import WorkspaceAvailabilityPage from "./pages/merchant/workspace/WorkspaceAvailabilityPage";
import WorkspaceCheckInPage from "./pages/merchant/workspace/WorkspaceCheckInPage";
import WorkspaceSettingsPage from "./pages/merchant/workspace/WorkspaceSettingsPage";
import WorkspaceReviewsPage from "./pages/merchant/workspace/ReviewsPage";
import WorkspaceRevenuePage from "./pages/merchant/workspace/RevenuePage";
import WorkspacePricingPage from "./pages/merchant/workspace/WorkspacePricingPage";
import WorkspaceMessagesPage from "./pages/merchant/workspace/WorkspaceMessagesPage";

// Car Rental imports
import CarRentalDashboard from "./pages/merchant/car-rental/CarRentalDashboard";
import CarRentalVehiclesPage from "./pages/merchant/car-rental/VehiclesPage";
import CarRentalBookingsPage from "./pages/merchant/car-rental/CarRentalBookingsPage";
import CarRentalSettingsPage from "./pages/merchant/car-rental/CarRentalSettingsPage";

// Transfer Provider imports
import TransfersDashboard from "./pages/merchant/transfers/TransfersDashboard";
import TransferServicesPage from "./pages/merchant/transfers/TransferServicesPage";
import TransferBookingsPage from "./pages/merchant/transfers/TransferBookingsPage";
import TransferSettingsPage from "./pages/merchant/transfers/TransferSettingsPage";
import TransferVehiclesPage from "./pages/merchant/transfers/TransferVehiclesPage";
import TransferRoutesPage from "./pages/merchant/transfers/TransferRoutesPage";

// Experience Host imports
import ExperiencesDashboard from "./pages/merchant/experiences/ExperiencesDashboard";
import ExperiencesListPage from "./pages/merchant/experiences/ExperiencesListPage";
import ExperienceBookingsPage from "./pages/merchant/experiences/ExperienceBookingsPage";
import ExperienceSettingsPage from "./pages/merchant/experiences/ExperienceSettingsPage";
import ExperienceRevenuePage from "./pages/merchant/experiences/ExperienceRevenuePage";
import ExperienceReviewsPage from "./pages/merchant/experiences/ExperienceReviewsPage";
import ExperiencePricingPage from "./pages/merchant/experiences/ExperiencePricingPage";
import ExperienceMessagesPage from "./pages/merchant/experiences/ExperienceMessagesPage";
import VenuePricingPage from "./pages/merchant/venue-owner/VenuePricingPage";
import VenueMessagesPage from "./pages/merchant/venue-owner/VenueMessagesPage";

// Corporate Portal imports
import CorporateLayout from "./components/corporate/CorporateLayout";
import CorporateDashboard from "./pages/corporate/CorporateDashboard";
import CorporateBookings from "./pages/corporate/CorporateBookings";
import CorporateEmployees from "./pages/corporate/CorporateEmployees";
import CorporatePolicies from "./pages/corporate/CorporatePolicies";
import CorporateInvoices from "./pages/corporate/CorporateInvoices";
import CorporateRegister from "./pages/corporate/CorporateRegister";
import CorporateSettings from "./pages/corporate/CorporateSettings";
import CorporateApprovals from "./pages/corporate/CorporateApprovals";
import CorporateReports from "./pages/corporate/CorporateReports";
import CorporateBookingLinks from "./pages/corporate/CorporateBookingLinks";
import BookingLinkResolver from "./pages/BookingLinkResolver";
import PayLinkCheckout from "./pages/PayLinkCheckout";
import BookingLinksPage from "./pages/merchant/shared/BookingLinksPage";
import MerchantLayout from "./components/merchant/layout/MerchantLayout";
import AgentLayout from "./components/merchant/layout/AgentLayout";
import ProtectedMerchantRoute from "./components/merchant/ProtectedMerchantRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

import MyAnalytics from "./pages/MyAnalytics";
import UnifiedMerchantDashboard from "./pages/merchant/UnifiedMerchantDashboard";

import Explore from "./pages/Explore";
import Activity from "./pages/Activity";
import InstallApp from "./pages/InstallApp";
import Inbox from "./pages/Inbox";
import AppBottomNav from "./components/AppBottomNav";
import DriverProfile from "./pages/DriverProfile";
import DriverRegister from "./pages/driver/DriverRegister";
import DriverVerification from "./pages/merchant/admin/DriverVerification";
import RideTracking from "./pages/RideTracking";

import RideShare from "./pages/RideShare";
import ExperienceResults from "./pages/ExperienceResults";
import ExperienceDetails from "./pages/ExperienceDetails";
import PayPage from "./pages/PayPage";
import SendMoney from "./pages/SendMoney";
import CardPayment from "./pages/CardPayment";
import RequestMoney from "./pages/RequestMoney";
import Remittance from "./pages/Remittance";
import WalletVaults from "./pages/wallet/Vaults";
import WalletVaultDetail from "./pages/wallet/VaultDetail";
import WalletAnalytics from "./pages/wallet/Analytics";
import WalletExchange from "./pages/wallet/Exchange";
import WalletSplitBill from "./pages/wallet/SplitBill";
import WalletScheduled from "./pages/wallet/ScheduledPayments";
import WalletVirtualCard from "./pages/wallet/VirtualCard";
import WalletStatements from "./pages/wallet/Statements";
import DSTVPayment from "./pages/bills/DSTVPayment";
import PrepaidElectricityZAPayment from "./pages/bills/PrepaidElectricityZAPayment";
import CellCPayment from "./pages/bills/CellCPayment";
import TelkomPayment from "./pages/bills/TelkomPayment";
import RewardsPage from "./pages/RewardsPage";
import SavedPlaces from "./pages/SavedPlaces";
import PromoCode from "./pages/PromoCode";
import Referral from "./pages/Referral";
import Vouchers from "./pages/Vouchers";
import Legal from "./pages/Legal";
import Rides from "./pages/Rides";
import PaymentMethods from "./pages/PaymentMethods";
import Promos from "./pages/Promos";
import CarResults from "./pages/CarResults";
import CarDetails from "./pages/CarDetails";
import FlightResults from "./pages/FlightResults";
import RailResults from "./pages/RailResults";
import TransferResults from "./pages/TransferResults";
import DriverLayout from "./components/driver/DriverLayout";
import ProtectedDriverRoute from "./components/ProtectedDriverRoute";
import DriverRequestsPage from "./pages/driver/DriverRequestsPage";
import DriverActivePage from "./pages/driver/DriverActivePage";
import DriverEarningsPage from "./pages/driver/DriverEarningsPage";
import DriverHistoryPage from "./pages/driver/DriverHistoryPage";
// Driver credits page removed
import DriverSettingsPage from "./pages/driver/DriverSettingsPage";
import DriverVehiclePage from "./pages/driver/DriverVehiclePage";
import DriverDocumentsPage from "./pages/driver/DriverDocumentsPage";
import DriverPerformancePage from "./pages/driver/DriverPerformancePage";

import ProfileEdit from "./pages/ProfileEdit";

// Admin Financial imports
import FinancialOverview from "./pages/merchant/admin/FinancialOverview";
import MerchantBillingAdmin from "./pages/merchant/admin/MerchantBilling";
import PaymentVerification from "./pages/merchant/admin/PaymentVerification";
import BillingAnalytics from "./pages/merchant/admin/BillingAnalytics";
import BillingControl from "./pages/merchant/admin/BillingControl";
import ServiceManagement from "./pages/merchant/admin/ServiceManagement";
import PayoutManagement from "./pages/merchant/admin/PayoutManagement";
import EscrowManagement from "./pages/merchant/admin/EscrowManagement";
import BillReconciliation from "./pages/merchant/admin/BillReconciliation";
import PlatformReconciliation from "./pages/merchant/admin/PlatformReconciliation";
import CommissionConfigPage from "./pages/merchant/admin/CommissionConfigPage";

// Shared Merchant imports
import MerchantBillingPage from "./pages/merchant/shared/MerchantBillingPage";
import MerchantRevenuePage from "./pages/merchant/shared/MerchantRevenuePage";
import MerchantPaymentPortalPage from "./pages/merchant/shared/MerchantPaymentPortalPage";

// Unified Dashboard imports
import { DashboardShell } from "./components/dashboard/DashboardShell";
import ConsumerDashboard from "./pages/dashboard/ConsumerDashboard";
import BookingsPage from "./pages/dashboard/BookingsPage";
import WalletPage from "./pages/dashboard/WalletPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import TripCheckoutPage from "./pages/checkout/TripCheckoutPage";
import { TripCartButton } from "./components/cart/TripCartButton";
import { TripCartSheet } from "./components/cart/TripCartSheet";
import { SwipeBackProvider } from "./components/SwipeBackProvider";

// Component to handle authenticated home or redirect to welcome
const AuthGatedHome = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/welcome" replace />;
  }
  
  return <Index />;
};

const AnimatedRoutes = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen splash in this session
    const seen = sessionStorage.getItem("splashSeen");
    if (seen) {
      setShowSplash(false);
      setHasSeenSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasSeenSplash(true);
    sessionStorage.setItem("splashSeen", "true");

    // Show onboarding for first-time users
    const onboarded = localStorage.getItem("fulticket_onboarded");
    if (!onboarded) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem("fulticket_onboarded", "true");
  };

  return (
    <>
      <SwipeBackProvider />
      {showSplash && !hasSeenSplash && (
        <SplashScreen onComplete={handleSplashComplete} minDisplayTime={3000} />
      )}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}
      <Toaster />
      <Sonner />
      <AnimatedRoutes>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/explore" element={<Explore />} />
          {/* Unified Orders page - /orders is the primary route */}
          <Route path="/orders" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          {/* Legacy routes redirect to /orders */}
          <Route path="/activity" element={<Navigate to="/orders" replace />} />
          <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/buses" element={<BusResults />} />
          <Route path="/buses/:id" element={<BusDetails />} />
          <Route path="/taxis" element={<RideBooking />} />
          <Route path="/ride-booking" element={<RideBooking />} />
          <Route path="/cars" element={<CarResults />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          <Route path="/flights" element={<FlightResults />} />
          <Route path="/rail" element={<RailResults />} />
          <Route path="/transfer-results" element={<TransferResults />} />
          <Route path="/transfers" element={<TransferBooking />} />
          <Route path="/transfers/:transferId/track" element={<TransferTracking />} />
          <Route path="/track/:shareCode" element={<TransferTracking />} />
          <Route path="/events" element={<EventResults />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/venues" element={<VenueResults />} />
          <Route path="/venues/:id" element={<VenueDetails />} />
          <Route path="/venues/quote/:linkCode" element={<VenueQuoteCheckout />} />
          <Route path="/stays" element={<StayResults />} />
          <Route path="/stays/:id" element={<StayDetails />} />
          <Route path="/workspaces" element={<WorkspaceResults />} />
          <Route path="/workspaces/:id" element={<WorkspaceDetails />} />
          <Route path="/booking/confirm" element={<BookingConfirm />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />
          <Route path="/payment/result" element={<PaymentCallback />} />
          <Route path="/bookings" element={<Navigate to="/orders" replace />} />
          <Route path="/auth" element={<Auth />} />
          {/* Legacy dashboard route - redirect to unified */}
          <Route path="/dashboard" element={<Navigate to="/account" replace />} />
          <Route path="/dashboard/bookings" element={<Navigate to="/account/bookings" replace />} />
          <Route path="/dashboard/rides" element={<Navigate to="/rides" replace />} />
          <Route path="/dashboard/wallet" element={<Navigate to="/pay" replace />} />
          <Route path="/dashboard/transactions" element={<Navigate to="/pay" replace />} />
          <Route path="/dashboard/favorites" element={<Navigate to="/saved" replace />} />
          <Route path="/dashboard/rewards" element={<Navigate to="/rewards" replace />} />
          <Route path="/dashboard/settings" element={<Navigate to="/account/settings" replace />} />
          <Route path="/my-analytics" element={<ProtectedRoute><MyAnalytics /></ProtectedRoute>} />
          
          {/* Profile Edit */}
          <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          
          {/* Unified Consumer Dashboard */}
          <Route path="/account" element={<ProtectedRoute><DashboardShell mode="consumer" /></ProtectedRoute>}>
            <Route index element={<ConsumerDashboard />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="wallet" element={<Navigate to="/pay" replace />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Legacy /settings redirect */}
          <Route path="/settings" element={<Navigate to="/account/settings" replace />} />
          
          <Route path="/merchant/dashboard" element={<ProtectedMerchantRoute><UnifiedMerchantDashboard /></ProtectedMerchantRoute>} />
          <Route path="/retrieve-booking" element={<RetrieveBooking />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          <Route path="/driver/register" element={<DriverRegister />} />
          <Route path="/help" element={<Help />} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/saved-travelers" element={<ProtectedRoute><SavedTravelers /></ProtectedRoute>} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/check-in" element={<CheckInPage />} />
          <Route path="/ticket/share/:token" element={<SharedTicket />} />
          <Route path="/verify/:reference?" element={<VerifyTicket />} />
          <Route path="/agents" element={<AgentDiscovery />} />
          <Route path="/install" element={<InstallApp />} />
          
          {/* Ride-hailing routes */}
          <Route path="/ride-tracking/:rideId" element={<ProtectedRoute><RideTracking /></ProtectedRoute>} />
          <Route path="/ride-history" element={<Navigate to="/rides" replace />} />
          <Route path="/ride-share/:shareCode" element={<RideShare />} />
          
          {/* Experience routes */}
          <Route path="/experiences" element={<ExperienceResults />} />
          <Route path="/experiences/:id" element={<ExperienceDetails />} />
          
          {/* Payment & Rewards */}
          <Route path="/pay" element={<PayPage />} />
          <Route path="/pay/send" element={<ProtectedRoute><SendMoney /></ProtectedRoute>} />
          {/* /pay/bills now redirects to /pay since billers are embedded there */}
          <Route path="/pay/bills" element={<PayPage />} />
          <Route path="/pay/bills/zesa" element={<ZesaTokenPurchase />} />
          <Route path="/pay/bills/bcc" element={<BCCPayment />} />
          <Route path="/pay/bills/econet" element={<EconetPayment />} />
          <Route path="/pay/bills/netone" element={<NetonePayment />} />
          <Route path="/pay/bills/telecel" element={<TelecelPayment />} />
          <Route path="/pay/bills/nyaradzo" element={<NyaradzoPayment />} />
          <Route path="/pay/bills/moonlight" element={<MoonlightPayment />} />
          <Route path="/pay/bills/edgars" element={<EdgarsPayment />} />
          <Route path="/pay/bills/jet" element={<JetPayment />} />
          <Route path="/pay/bills/dstv" element={<DSTVPayment />} />
          <Route path="/pay/bills/sa-electricity" element={<PrepaidElectricityZAPayment />} />
          <Route path="/pay/bills/cellc" element={<CellCPayment />} />
          <Route path="/pay/bills/telkom" element={<TelkomPayment />} />
          <Route path="/pay/card" element={<ProtectedRoute><CardPayment /></ProtectedRoute>} />
          <Route path="/pay/request" element={<ProtectedRoute><RequestMoney /></ProtectedRoute>} />
          <Route path="/pay/remittance" element={<ProtectedRoute><Remittance /></ProtectedRoute>} />
          <Route path="/wallet/vaults" element={<ProtectedRoute><WalletVaults /></ProtectedRoute>} />
          <Route path="/wallet/vaults/:id" element={<ProtectedRoute><WalletVaultDetail /></ProtectedRoute>} />
          <Route path="/wallet/analytics" element={<ProtectedRoute><WalletAnalytics /></ProtectedRoute>} />
          <Route path="/wallet/exchange" element={<ProtectedRoute><WalletExchange /></ProtectedRoute>} />
          <Route path="/wallet/split" element={<ProtectedRoute><WalletSplitBill /></ProtectedRoute>} />
          <Route path="/wallet/scheduled" element={<ProtectedRoute><WalletScheduled /></ProtectedRoute>} />
          <Route path="/wallet/card" element={<ProtectedRoute><WalletVirtualCard /></ProtectedRoute>} />
          <Route path="/wallet/statements" element={<ProtectedRoute><WalletStatements /></ProtectedRoute>} />
          <Route path="/pay/bills/history" element={<ProtectedRoute><BillHistory /></ProtectedRoute>} />
          <Route path="/gift-cards" element={<GiftCards />} />
          <Route path="/gift-cards/purchase" element={<ProtectedRoute><GiftCardPurchase /></ProtectedRoute>} />
          <Route path="/gift-cards/card/:id" element={<GiftCardDetail />} />
          <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
          
          {/* User Account Pages */}
          <Route path="/saved" element={<ProtectedRoute><SavedPlaces /></ProtectedRoute>} />
          <Route path="/promo" element={<PromoCode />} />
          <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
          <Route path="/vouchers" element={<ProtectedRoute><Vouchers /></ProtectedRoute>} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/rides" element={<ProtectedRoute><Rides /></ProtectedRoute>} />
          <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
          <Route path="/promos" element={<Promos />} />
          
          {/* Driver Portal */}
          <Route path="/driver" element={<ProtectedDriverRoute><DriverLayout /></ProtectedDriverRoute>}>
            <Route index element={<DriverProfile />} />
            <Route path="profile" element={<DriverProfile />} />
            <Route path="requests" element={<DriverRequestsPage />} />
            <Route path="active" element={<DriverActivePage />} />
            <Route path="earnings" element={<DriverEarningsPage />} />
            <Route path="history" element={<DriverHistoryPage />} />
            <Route path="settings" element={<DriverSettingsPage />} />
            <Route path="vehicle" element={<DriverVehiclePage />} />
            <Route path="documents" element={<DriverDocumentsPage />} />
            <Route path="performance" element={<DriverPerformancePage />} />
          </Route>
          {/* Corporate Portal Routes */}
          <Route path="/corporate/register" element={<CorporateRegister />} />
          <Route path="/corporate" element={<ProtectedRoute><CorporateLayout /></ProtectedRoute>}>
            <Route index element={<CorporateDashboard />} />
            <Route path="bookings" element={<CorporateBookings />} />
            <Route path="employees" element={<CorporateEmployees />} />
            <Route path="policies" element={<CorporatePolicies />} />
            <Route path="invoices" element={<CorporateInvoices />} />
            <Route path="settings" element={<CorporateSettings />} />
            <Route path="approvals" element={<CorporateApprovals />} />
            <Route path="reports" element={<CorporateReports />} />
            <Route path="booking-links" element={<CorporateBookingLinks />} />
          </Route>
          
          {/* Merchant Routes - redirect old auth to unified */}
          <Route path="/merchant/auth" element={<Navigate to="/auth" state={{ mode: "signup", userType: "merchant" }} replace />} />
          <Route path="/merchant/portal" element={<MerchantPortal />} />
          
          {/* Admin Routes */}
          <Route path="/merchant/admin/auth" element={<AdminAuth />} />
          <Route path="/merchant/admin" element={
            <ProtectedAdminRoute>
              <MerchantLayout />
            </ProtectedAdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="credentials" element={<CredentialProvisioning />} />
            <Route path="merchant-verification" element={<MerchantVerification />} />
            <Route path="merchant-analytics" element={<MerchantAnalytics />} />
            <Route path="merchant-suspension" element={<MerchantSuspension />} />
            <Route path="account-lifecycle" element={<AccountLifecycle />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="activity-logs" element={<ActivityLogs />} />
            <Route path="booking/:bookingId" element={<AdminBookingDetail />} />
            <Route path="system-health" element={<SystemHealth />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="transactions" element={<TransactionMonitoring />} />
            <Route path="support" element={<SupportManagement />} />
            <Route path="merchant-performance" element={<MerchantPerformance />} />
            <Route path="agent-verification" element={<AgentVerification />} />
            <Route path="agent-performance" element={<AgentPerformance />} />
            <Route path="ad-management" element={<AdManagement />} />
            {/* ecocash verification removed */}
            <Route path="driver-verification" element={<DriverVerification />} />
            <Route path="ride-analytics" element={<RideAnalytics />} />
            <Route path="kyc-management" element={<KYCManagement />} />
            {/* Admin Financial Routes */}
            <Route path="financial" element={<FinancialOverview />} />
            <Route path="merchant-billing" element={<MerchantBillingAdmin />} />
            <Route path="payment-verification" element={<PaymentVerification />} />
            <Route path="billing-analytics" element={<BillingAnalytics />} />
            <Route path="billing-control" element={<BillingControl />} />
            <Route path="service-management" element={<ServiceManagement />} />
            <Route path="payouts" element={<PayoutManagement />} />
            <Route path="escrow" element={<EscrowManagement />} />
            <Route path="bill-reconciliation" element={<BillReconciliation />} />
            <Route path="platform-reconciliation" element={<PlatformReconciliation />} />
            <Route path="commission-config" element={<CommissionConfigPage />} />
            <Route path="bill-activity" element={<MerchantBillActivity />} />
            <Route path="promos" element={<PromoManagement />} />
            <Route path="innbucks-tools" element={<InnBucksToolsPage />} />
            <Route path="agent-float" element={<AdminAgentFloatManager />} />
          </Route>
          
          {/* Bus Operator Routes */}
          <Route path="/merchant/bus-operator" element={
            <ProtectedMerchantRoute requiredRole="bus_operator">
              <MerchantLayout />
            </ProtectedMerchantRoute>
          }>
            <Route index element={<BusOperatorDashboard />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="bookings" element={<BusOperatorBookingsPage />} />
            <Route path="check-in" element={<BusOperatorCheckInPage />} />
            <Route path="revenue" element={<BusOperatorRevenuePage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="reviews" element={<BusOperatorReviewsPage />} />
            <Route path="analytics" element={<BusOperatorAnalyticsPage />} />
            <Route path="booking-actions" element={<BusOperatorBookingActionsPage />} />
            <Route path="chatbot-settings" element={<ChatbotSettingsPage />} />
            <Route path="payment-settings" element={<PaymentSettingsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="payouts" element={<PayoutsPage />} />
            {/* credits route removed */}
            <Route path="profile" element={<MerchantProfile />} />
            <Route path="settings" element={<BusOperatorSettingsPage />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="advertising" element={<AdvertisingPage />} />
            <Route path="billing" element={<MerchantBillingPage />} />
            <Route path="payment-portal" element={<MerchantPaymentPortalPage />} />
            <Route path="booking-links" element={<BookingLinksPage />} />
          </Route>
          
          {/* Event Organizer Routes */}
          <Route path="/merchant/event-organizer" element={
            <ProtectedMerchantRoute requiredRole="event_organizer">
              <MerchantLayout />
            </ProtectedMerchantRoute>
          }>
            <Route index element={<EventOrganizerDashboard />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="attendees" element={<AttendeesPage />} />
            <Route path="revenue" element={<EventOrganizerRevenuePage />} />
            <Route path="check-in" element={<OrganizerCheckInPage />} />
            <Route path="school-events" element={<SchoolEventsPage />} />
            <Route path="marketing" element={<MarketingPage />} />
            <Route path="waitlist" element={<WaitlistPage />} />
            <Route path="reviews" element={<EventOrganizerReviewsPage />} />
            <Route path="analytics" element={<EventOrganizerAnalyticsPage />} />
            <Route path="booking-actions" element={<EventOrganizerBookingActionsPage />} />
            <Route path="payment-settings" element={<PaymentSettingsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="payouts" element={<PayoutsPage />} />
            {/* credits route removed */}
            <Route path="profile" element={<MerchantProfile />} />
            <Route path="settings" element={<EventOrganizerSettingsPage />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="advertising" element={<AdvertisingPage />} />
            <Route path="billing" element={<MerchantBillingPage />} />
            <Route path="payment-portal" element={<MerchantPaymentPortalPage />} />
            <Route path="booking-links" element={<BookingLinksPage />} />
            <Route path="pricing" element={<EventPricingPage />} />
            <Route path="messages" element={<EventMessagesPage />} />
            <Route path="seat-map" element={<SeatMapEditorPage />} />
            <Route path="schedule" element={<FestivalSchedulePage />} />
            <Route path="staff" element={<EventStaffPage />} />
            <Route path="sponsors" element={<SponsorsPage />} />
            <Route path="live" element={<LiveEventDashboard />} />
            <Route path="live/:eventId" element={<LiveEventDashboard />} />
            <Route path="reports" element={<PostEventReportPage />} />
            <Route path="reports/:eventId" element={<PostEventReportPage />} />
          </Route>
          
          {/* Venue Owner Routes */}
          <Route path="/merchant/venue-owner" element={
            <ProtectedMerchantRoute requiredRole="venue_owner">
              <MerchantLayout />
            </ProtectedMerchantRoute>
          }>
            <Route index element={<VenueOwnerDashboard />} />
            <Route path="venues" element={<VenueOwnerVenuesPage />} />
            <Route path="bookings" element={<VenueOwnerBookingsPage />} />
            <Route path="quotes" element={<VenueOwnerQuotesPage />} />
            <Route path="availability" element={<VenueOwnerAvailabilityPage />} />
            <Route path="revenue" element={<VenueOwnerRevenuePage />} />
            <Route path="reviews" element={<VenueOwnerReviewsPage />} />
            <Route path="pricing" element={<VenuePricingPage />} />
            <Route path="messages" element={<VenueMessagesPage />} />
            <Route path="payment-settings" element={<PaymentSettingsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="payouts" element={<PayoutsPage />} />
            <Route path="profile" element={<MerchantProfile />} />
            <Route path="advertising" element={<AdvertisingPage />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="settings" element={<VenueOwnerSettingsPage />} />
            <Route path="billing" element={<MerchantBillingPage />} />
            <Route path="payment-portal" element={<MerchantPaymentPortalPage />} />
          </Route>
          
          {/* Travel Agent / Booking Agent Routes - Standalone Portal */}
          <Route path="/merchant/agent" element={
            <ProtectedMerchantRoute>
              <AgentLayout />
            </ProtectedMerchantRoute>
          }>
            <Route index element={<TravelAgentDashboard />} />
            <Route path="bookings" element={<AgentBookingsPage />} />
            <Route path="payments" element={<AgentPaymentsPage />} />
            <Route path="clients" element={<AgentClientsPage />} />
            
            <Route path="analytics" element={<AgentAnalyticsPage />} />
            <Route path="bulk-booking" element={<AgentBulkBookingPage />} />
            <Route path="sub-agents" element={<SubAgentsPage />} />
            <Route path="settings" element={<AgentSettingsPage />} />
            {/* credits route removed */}
            <Route path="services" element={<AgentServiceManagement />} />
            <Route path="register-merchant" element={<AgentMerchantRegistration />} />
            <Route path="manage-merchants" element={<AgentMerchantManagement />} />
            <Route path="profile" element={<AgentProfile />} />
            <Route path="bill-pay" element={<AgentBillPayPage />} />
            <Route path="bill-history" element={<AgentBillHistory />} />
            <Route path="bill-reconciliation" element={<AgentBillReconciliation />} />
            <Route path="innbucks-tools" element={<InnBucksToolsPage />} />
          </Route>
          
          {/* Property Owner Routes */}
          <Route path="/merchant/property-owner" element={
            <ProtectedMerchantRoute requiredRole="property_owner">
              <MerchantLayout />
            </ProtectedMerchantRoute>
          }>
            <Route index element={<PropertyOwnerDashboard />} />
            <Route path="properties" element={<PropertyOwnerPropertiesPage />} />
            <Route path="rooms" element={<PropertyOwnerRoomsPage />} />
            <Route path="bookings" element={<PropertyOwnerBookingsPage />} />
            <Route path="availability" element={<PropertyOwnerAvailabilityPage />} />
            <Route path="revenue" element={<PropertyOwnerRevenuePage />} />
            <Route path="reviews" element={<PropertyOwnerReviewsPage />} />
            <Route path="payment-settings" element={<PaymentSettingsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="payouts" element={<PayoutsPage />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="advertising" element={<AdvertisingPage />} />
            <Route path="settings" element={<PropertyOwnerSettingsPage />} />
            <Route path="pricing" element={<PropertyOwnerPricingPage />} />
            <Route path="messages" element={<PropertyOwnerMessagesPage />} />
            <Route path="billing" element={<MerchantBillingPage />} />
            <Route path="payment-portal" element={<MerchantPaymentPortalPage />} />
            <Route path="booking-links" element={<BookingLinksPage />} />
            {/* credits route removed */}
            <Route path="profile" element={<MerchantProfile />} />
          </Route>
          
          {/* Airline Partner Routes */}
          <Route path="/merchant/airline" element={
            <ProtectedMerchantRoute requiredRole="airline_partner">
              <MerchantLayout />
            </ProtectedMerchantRoute>
          }>
            <Route index element={<AirlineDashboard />} />
            <Route path="flights" element={<AirlineFlightsPage />} />
            <Route path="bookings" element={<AirlineBookingsPage />} />
            <Route path="payment-settings" element={<PaymentSettingsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="settings" element={<AirlineSettingsPage />} />
            {/* credits route removed */}
            <Route path="profile" element={<MerchantProfile />} />
            <Route path="revenue" element={<MerchantRevenuePage />} />
            <Route path="billing" element={<MerchantBillingPage />} />
          </Route>
          
          {/* Workspace Provider Routes */}
          <Route path="/merchant/workspace" element={
            <ProtectedMerchantRoute requiredRole="workspace_provider">
              <MerchantLayout />
            </ProtectedMerchantRoute>
          }>
            <Route index element={<WorkspaceDashboard />} />
            <Route path="spaces" element={<WorkspaceSpacesPage />} />
            <Route path="bookings" element={<WorkspaceBookingsPage />} />
            <Route path="availability" element={<WorkspaceAvailabilityPage />} />
            <Route path="check-in" element={<WorkspaceCheckInPage />} />
            <Route path="reviews" element={<WorkspaceReviewsPage />} />
            <Route path="revenue" element={<WorkspaceRevenuePage />} />
            <Route path="pricing" element={<WorkspacePricingPage />} />
            <Route path="messages" element={<WorkspaceMessagesPage />} />
            <Route path="payment-settings" element={<PaymentSettingsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="payouts" element={<PayoutsPage />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="settings" element={<WorkspaceSettingsPage />} />
            {/* credits route removed */}
            <Route path="profile" element={<MerchantProfile />} />
            <Route path="billing" element={<MerchantBillingPage />} />
            <Route path="payment-portal" element={<MerchantPaymentPortalPage />} />
          </Route>
          
          {/* Car Rental Routes */}
          <Route path="/merchant/car-rental" element={
            <ProtectedMerchantRoute requiredRole="car_rental_company">
              <MerchantLayout />
            </ProtectedMerchantRoute>
          }>
            <Route index element={<CarRentalDashboard />} />
            <Route path="vehicles" element={<CarRentalVehiclesPage />} />
            <Route path="bookings" element={<CarRentalBookingsPage />} />
            <Route path="payment-settings" element={<PaymentSettingsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="settings" element={<CarRentalSettingsPage />} />
            {/* credits route removed */}
            <Route path="profile" element={<MerchantProfile />} />
            <Route path="maintenance" element={<div className="p-6"><h1 className="text-xl font-semibold">Vehicle Maintenance</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>} />
            <Route path="revenue" element={<MerchantRevenuePage />} />
            <Route path="billing" element={<MerchantBillingPage />} />
          </Route>
          
          {/* Transfer Provider Routes */}
          <Route path="/merchant/transfers" element={
            <ProtectedMerchantRoute requiredRole="transfer_provider">
              <MerchantLayout />
            </ProtectedMerchantRoute>
          }>
            <Route index element={<TransfersDashboard />} />
            <Route path="services" element={<TransferServicesPage />} />
            <Route path="vehicles" element={<TransferVehiclesPage />} />
            <Route path="routes" element={<TransferRoutesPage />} />
            <Route path="bookings" element={<TransferBookingsPage />} />
            <Route path="payment-settings" element={<PaymentSettingsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="settings" element={<TransferSettingsPage />} />
            {/* credits route removed */}
            <Route path="profile" element={<MerchantProfile />} />
            <Route path="revenue" element={<MerchantRevenuePage />} />
            <Route path="billing" element={<MerchantBillingPage />} />
          </Route>
          
          {/* Experience Host Routes */}
          <Route path="/merchant/experiences" element={
            <ProtectedMerchantRoute requiredRole="experience_host">
              <MerchantLayout />
            </ProtectedMerchantRoute>
          }>
            <Route index element={<ExperiencesDashboard />} />
            <Route path="list" element={<ExperiencesListPage />} />
            <Route path="bookings" element={<ExperienceBookingsPage />} />
            <Route path="pricing" element={<ExperiencePricingPage />} />
            <Route path="messages" element={<ExperienceMessagesPage />} />
            <Route path="payment-settings" element={<PaymentSettingsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="payouts" element={<PayoutsPage />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="settings" element={<ExperienceSettingsPage />} />
            <Route path="profile" element={<MerchantProfile />} />
            <Route path="revenue" element={<ExperienceRevenuePage />} />
            <Route path="reviews" element={<ExperienceReviewsPage />} />
            <Route path="billing" element={<MerchantBillingPage />} />
            <Route path="payment-portal" element={<MerchantPaymentPortalPage />} />
          </Route>
          
          {/* Booking Link Resolution Routes */}
          <Route path="/book/:linkCode" element={<BookingLinkResolver />} />
          <Route path="/pay-link/:linkCode" element={<PayLinkCheckout />} />
          
          {/* Trip Cart Checkout */}
          <Route path="/checkout/trip" element={<ProtectedRoute><TripCheckoutPage /></ProtectedRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatedRoutes>
        <TripCartButton />
        <TripCartSheet />
        
        <AppBottomNav />
        <OfflineIndicator />
      </>
    );
};

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <GoogleMapsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppContent />
        </BrowserRouter>
      </GoogleMapsProvider>
    </ThemeProvider>
  );
};

export default App;
