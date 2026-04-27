import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Zap, WifiOff, Bell, Shield, ArrowLeft, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import MobileAppLayout from "@/components/MobileAppLayout";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant loading, even faster than the website",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: WifiOff,
      title: "Works Offline",
      description: "Access your tickets and bookings without internet",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Get instant updates on your bookings and promos",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data stays on your device, always protected",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  if (isInstalled) {
    return (
      <MobileAppLayout>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="h-24 w-24 rounded-3xl bg-emerald-500 flex items-center justify-center mb-6"
          >
            <Smartphone className="h-12 w-12 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">Already Installed!</h1>
          <p className="text-muted-foreground mb-6">
            TodaPay is installed on your device. You can find it on your home screen.
          </p>
          <Link to="/">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go to Home
            </Button>
          </Link>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <h1 className="text-lg font-semibold">Install App</h1>
          </div>
        </header>

        <main className="p-4 space-y-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="h-24 w-24 rounded-3xl bg-primary mx-auto flex items-center justify-center mb-6 shadow-glow">
              <span className="text-primary-foreground font-black text-4xl">F</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Install TodaPay</h1>
            <p className="text-muted-foreground">
              Add TodaPay to your home screen for the best experience
            </p>
          </motion.div>

          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/30"
              >
                <div className={`h-12 w-12 rounded-xl ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Install Instructions */}
          {isIOS ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-muted/50 rounded-2xl p-5 space-y-4"
            >
              <h3 className="font-semibold text-center">How to Install on iPhone</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                  <div className="flex items-center gap-2">
                    <span>Tap the</span>
                    <Share className="h-5 w-5 text-primary" />
                    <span>Share button</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <span>Tap "Add" in the top right</span>
                </div>
              </div>
            </motion.div>
          ) : deferredPrompt ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={handleInstall}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-lg"
              >
                <Download className="h-6 w-6" />
                Install Now
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-muted/50 rounded-2xl p-5 space-y-4"
            >
              <h3 className="font-semibold text-center">How to Install</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                  <div className="flex items-center gap-2">
                    <span>Tap the</span>
                    <MoreVertical className="h-5 w-5 text-primary" />
                    <span>menu button</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                  <span>Tap "Install app" or "Add to Home Screen"</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <span>Confirm the installation</span>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default InstallApp;
