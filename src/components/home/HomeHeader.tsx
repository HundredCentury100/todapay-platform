import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Sun, Moon, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { NotificationPopover } from "@/components/notifications/NotificationPopover";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useTheme } from "next-themes";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";

export const HomeHeader = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [greeting, setGreeting] = useState("Hello");
  const { location: deviceLocation, isDetecting } = useDeviceLocation();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const locationDisplay = isDetecting
    ? "Detecting..."
    : deviceLocation?.displayName || "Select Location";

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || 
                    user?.email?.split("@")[0] || 
                    "there";

  return (
    <header className="bg-background border-b border-border md:hidden safe-area-pt">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left - Avatar/Logo and Location */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {user ? (
              <Link to="/profile" className="flex-shrink-0">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                      {firstName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </Link>
            ) : (
              <Link to="/" className="flex items-center flex-shrink-0">
                <BrandLogo size="sm" />
              </Link>
            )}
            
            <div className="flex flex-col min-w-0">
              {user && (
                <p className="text-xs text-muted-foreground truncate">{greeting}, {firstName}</p>
              )}
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-muted-foreground truncate">{locationDisplay}</span>
              </div>
            </div>
          </div>

          {/* Right - Theme toggle + Notifications/Sign In */}
          <div className="flex items-center gap-1.5">
            <a
              href="https://wa.me/263789583003"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 rounded-full bg-[hsl(142,70%,45%)] flex items-center justify-center"
              aria-label="Chat on WhatsApp"
            >
              <MessageCircle className="h-4 w-4 text-white" />
            </a>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
              aria-label="Toggle theme"
            >
            {theme === "dark" ? (
                <Sun className="h-4 w-4 text-primary" />
              ) : (
                <Moon className="h-4 w-4 text-muted-foreground" />
              )}
            </motion.button>
            {user ? (
              <NotificationPopover />
            ) : (
              <Link to="/auth">
                <motion.div 
                  whileTap={{ scale: 0.95 }}
                  className="h-9 px-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium"
                >
                  Sign In
                </motion.div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
