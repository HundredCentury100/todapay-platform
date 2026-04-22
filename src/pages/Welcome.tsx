import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight } from "lucide-react";
import { 
  WelcomeHero, 
  ServicePillRow, 
  SocialProofBar, 
  RolePreviewCards 
} from "@/components/welcome";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users to home
  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orb - top right */}
        <motion.div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary-glow/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
        {/* Medium gradient orb - bottom left */}
        <motion.div 
          className="absolute bottom-20 -left-32 w-64 h-64 bg-gradient-to-tr from-violet-500/15 to-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        {/* Small accent orb - center */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 180, 360],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            ease: "linear" 
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col justify-between px-6 py-8 sm:py-12 safe-area-pt safe-area-pb">
        {/* Top section - Hero */}
        <div className="flex-1 flex flex-col justify-center space-y-10">
          <WelcomeHero />
          <ServicePillRow />
        </div>

        {/* Middle section - CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="space-y-3 py-6"
        >
          <Button
            onClick={() => navigate("/auth", { state: { mode: "signup" } })}
            className="w-full h-14 rounded-2xl text-base font-semibold shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-opacity"
            size="lg"
          >
            Get Started
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            onClick={() => navigate("/auth", { state: { mode: "signin" } })}
            variant="ghost"
            className="w-full h-14 rounded-2xl text-base font-semibold hover:bg-secondary/50"
            size="lg"
          >
            I have an account
          </Button>
        </motion.div>

        {/* Bottom section - Social proof & Role selection */}
        <div className="space-y-4">
          <SocialProofBar />
          <RolePreviewCards />
        </div>
      </div>
    </div>
  );
};

export default Welcome;
