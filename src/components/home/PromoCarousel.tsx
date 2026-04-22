import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Zap, Music, Home, Bus, Gift, Ticket, Car, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const promos = [
  {
    id: 1,
    title: "50% Off First Ride",
    subtitle: "New users only",
    cta: "Book Now",
    path: "/ride-booking",
    icon: Car,
    gradient: "from-blue-600 via-blue-500 to-cyan-400",
    pattern: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)",
    badge: "LIMITED",
  },
  {
    id: 2,
    title: "Live Events This Week",
    subtitle: "Concerts & festivals near you",
    cta: "Explore",
    path: "/events",
    icon: Music,
    gradient: "from-rose-600 via-pink-500 to-orange-400",
    pattern: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 50%)",
    badge: "HOT",
  },
  {
    id: 3,
    title: "Weekend Getaways",
    subtitle: "20% off top stays",
    cta: "Book Stay",
    path: "/stays",
    icon: Home,
    gradient: "from-amber-500 via-orange-500 to-red-400",
    pattern: "radial-gradient(circle at 90% 90%, rgba(255,255,255,0.1) 0%, transparent 40%)",
    badge: "DEAL",
  },
  {
    id: 4,
    title: "Unlimited Bus Pass",
    subtitle: "Travel more, pay less",
    cta: "Get Pass",
    path: "/buses",
    icon: Bus,
    gradient: "from-emerald-600 via-green-500 to-teal-400",
    pattern: "radial-gradient(circle at 10% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)",
    badge: "NEW",
  },
  {
    id: 5,
    title: "Refer & Earn $5",
    subtitle: "Share with friends",
    cta: "Refer Now",
    path: "/referrals",
    icon: Gift,
    gradient: "from-violet-600 via-purple-500 to-fuchsia-400",
    pattern: "radial-gradient(circle at 70% 60%, rgba(255,255,255,0.12) 0%, transparent 45%)",
    badge: "EARN",
  },
  {
    id: 6,
    title: "Flash Sale: Tickets",
    subtitle: "Up to 40% off events",
    cta: "Grab Deal",
    path: "/events",
    icon: Ticket,
    gradient: "from-sky-500 via-indigo-500 to-violet-500",
    pattern: "radial-gradient(circle at 50% 10%, rgba(255,255,255,0.18) 0%, transparent 50%)",
    badge: "⚡ FLASH",
  },
];

const badgeColors: Record<string, string> = {
  LIMITED: "bg-white/25",
  HOT: "bg-red-400/30",
  DEAL: "bg-yellow-400/30",
  NEW: "bg-emerald-400/30",
  EARN: "bg-purple-400/30",
  "⚡ FLASH": "bg-sky-400/30",
};

export const PromoCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // Disable auto-play on mobile to prevent blocking page scroll
  const isMobile = window.innerWidth < 768;
  const [isAutoPlaying, setIsAutoPlaying] = useState(!isMobile);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[index] as HTMLElement;
    if (!card) return;
    container.scrollTo({ left: card.offsetLeft - 20, behavior: "smooth" });
    setActiveIndex(index);
  }, []);

  // Auto-scroll (disabled on mobile)
  useEffect(() => {
    if (!isAutoPlaying || isMobile) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % promos.length;
        scrollToIndex(next);
        return next;
      });
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying, scrollToIndex, isMobile]);

  // Pause on interaction
  const handleInteractionStart = () => {
    setIsAutoPlaying(false);
    clearInterval(intervalRef.current);
  };

  const handleInteractionEnd = () => {
    setTimeout(() => setIsAutoPlaying(true), 6000);
  };

  // Track scroll position for dots
  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const cardWidth = (container.children[0] as HTMLElement)?.offsetWidth || 260;
    const gap = 12;
    const idx = Math.round(scrollLeft / (cardWidth + gap));
    if (idx !== activeIndex && idx >= 0 && idx < promos.length) {
      setActiveIndex(idx);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground">Deals & Offers</h2>
        </div>
        <Link to="/promos" className="flex items-center gap-0.5 text-xs font-medium text-primary press-effect">
          See all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-5 snap-x snap-mandatory pb-2"
        style={{ touchAction: 'pan-x pan-y' }}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onScroll={handleScroll}
      >
        {promos.map((promo, index) => {
          const Icon = promo.icon;
          return (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="snap-start shrink-0"
            >
              <Link to={promo.path}>
                <motion.div
                  className={`relative rounded-2xl min-w-[260px] h-[130px] overflow-hidden bg-gradient-to-br ${promo.gradient} shadow-lg`}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0" style={{ background: promo.pattern }} />

                  {/* Floating icon */}
                  <motion.div
                    className="absolute right-3 top-3 opacity-20"
                    animate={{ y: [0, -6, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className="h-16 w-16 text-white" strokeWidth={1} />
                  </motion.div>

                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                  />

                  {/* Content */}
                  <div className="relative h-full p-4 flex flex-col justify-between text-white">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${badgeColors[promo.badge] || "bg-white/20"} backdrop-blur-sm`}>
                          {promo.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold leading-tight drop-shadow-sm">{promo.title}</h3>
                      <p className="text-white/80 text-xs mt-0.5">{promo.subtitle}</p>
                    </div>
                    <motion.span
                      className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full w-fit"
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.35)" }}
                    >
                      {promo.cta}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </motion.span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 px-5">
        {promos.map((_, i) => (
          <button
            key={i}
            onClick={() => { scrollToIndex(i); handleInteractionStart(); handleInteractionEnd(); }}
            className="p-0.5"
            aria-label={`Go to promo ${i + 1}`}
          >
            <motion.div
              className="rounded-full bg-foreground/30"
              animate={{
                width: i === activeIndex ? 20 : 6,
                opacity: i === activeIndex ? 1 : 0.4,
              }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              style={{ height: 6 }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
