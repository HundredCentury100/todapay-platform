import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { NotificationPopover } from "@/components/notifications/NotificationPopover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Sun, Moon, ChevronDown, MessageCircle, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const travelVerticals = [
  { label: "Buses", path: "/buses", emoji: "🚌" },
  { label: "Flights", path: "/flights", emoji: "✈️" },
  { label: "Rail", path: "/rail", emoji: "🚆" },
  { label: "Rides", path: "/rides", emoji: "🚗" },
  { label: "Transfers", path: "/transfers", emoji: "🚐" },
  { label: "Car Rental", path: "/car-rental", emoji: "🏎️" },
];

const stayVerticals = [
  { label: "Stays", path: "/stays", emoji: "🏨" },
  { label: "Workspaces", path: "/workspaces", emoji: "💻" },
  { label: "Venues", path: "/venues", emoji: "🎪" },
];

const experienceVerticals = [
  { label: "Events", path: "/events", emoji: "🎫" },
  { label: "Experiences", path: "/experiences", emoji: "🌄" },
];

const DesktopTopNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { location: deviceLocation, isDetecting } = useDeviceLocation();
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const hiddenRoutes = ["/merchant", "/admin", "/driver", "/welcome", "/auth"];
  if (hiddenRoutes.some((route) => location.pathname.startsWith(route))) {
    return null;
  }

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const locationDisplay = isDetecting
    ? "Detecting..."
    : deviceLocation?.displayName || "Zimbabwe";

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const NavLink = ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <Link
      to={to}
      className={cn(
        "text-sm font-medium transition-colors px-3 py-2 rounded-md",
        isActive(to)
          ? "text-primary bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary",
        className
      )}
    >
      {children}
    </Link>
  );

  const VerticalGrid = ({ items }: { items: typeof travelVerticals }) => (
    <div className="grid gap-1 p-2 w-[280px]">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
            isActive(item.path)
              ? "bg-accent text-accent-foreground"
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="text-lg">{item.emoji}</span>
          <span className="text-sm font-medium">{item.label}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <nav className="hidden md:block sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      {/* Top bar: greeting + location */}
      <div className="max-w-6xl mx-auto px-6 h-9 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            {greeting}, <span className="font-medium text-foreground">{firstName}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-primary" />
          <span className="text-xs text-muted-foreground">{locationDisplay}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex-shrink-0">
            <BrandLogo size="sm" />
          </Link>

          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-secondary data-[state=open]:bg-secondary h-9 px-3">
                  Travel
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <VerticalGrid items={travelVerticals} />
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-secondary data-[state=open]:bg-secondary h-9 px-3">
                  Places
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <VerticalGrid items={stayVerticals} />
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-secondary data-[state=open]:bg-secondary h-9 px-3">
                  Things to Do
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <VerticalGrid items={experienceVerticals} />
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavLink to="/pay">Pay</NavLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavLink to="/explore">Explore</NavLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/263789583003"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 rounded-full bg-[hsl(142,70%,45%)] flex items-center justify-center hover:opacity-90 transition-opacity"
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
            <>
              <NavLink to="/orders">Orders</NavLink>
              <NotificationPopover />
              <Link to="/profile" className="ml-1">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                    {firstName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <Link to="/auth">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="h-9 px-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold"
              >
                Sign In
              </motion.div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DesktopTopNav;
