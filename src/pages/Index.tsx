import { motion } from "framer-motion";
import DesktopTopNav from "@/components/DesktopTopNav";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HeroSection } from "@/components/home/HeroSection";
import { ServiceGrid } from "@/components/home/ServiceGrid";
import { WalletWidget } from "@/components/home/WalletWidget";
import { PromoCarousel } from "@/components/home/PromoCarousel";
import { QuickActions } from "@/components/home/QuickActions";
import { ContinueBookingCard } from "@/components/home/ContinueBookingCard";
import { AIRecommendations } from "@/components/home/AIRecommendations";
import Footer from "@/components/Footer";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import { getUserPreferences } from "@/hooks/useUserPreferences";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";
import { CountryWelcomeBanner } from "@/components/CountryWelcomeBanner";

const Index = () => {
  const prefs = getUserPreferences();
  const isReturning = prefs.visitCount && prefs.visitCount > 1;
  const baseDelay = isReturning ? 0.02 : 0.04;
  const { countryChanged, dismissCountryChange } = useDeviceLocation();

  return (
    <>
      <DesktopTopNav />
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0 overflow-x-hidden md:max-w-3xl md:mx-auto lg:max-w-5xl xl:max-w-6xl">
      <HomeHeader />

      <CountryWelcomeBanner countryChanged={countryChanged} onDismiss={dismissCountryChange} />

      <ContinueBookingCard />

      <main className="flex-1 flex flex-col md:pt-0">
        <HeroSection />

        <div className="flex flex-col gap-6 py-2">
          {/* Services Grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: baseDelay, duration: 0.35 }}
          >
            <ServiceGrid />
          </motion.div>

          {/* Wallet Widget */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: baseDelay * 2, duration: 0.35 }}
          >
            <WalletWidget />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: baseDelay * 3, duration: 0.35 }}
          >
            <QuickActions />
          </motion.div>

          {/* Promo Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: baseDelay * 4, duration: 0.35 }}
          >
            <PromoCarousel />
          </motion.div>

          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: baseDelay * 5, duration: 0.35 }}
          >
            <AIRecommendations />
          </motion.div>
        </div>
      </main>

      <Footer />
      <AccessibilityWidget />
    </div>
    </>
  );
};

export default Index;
