import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronRight, Shield, Clock, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Host {
  name: string;
  image?: string | null;
  rating?: number;
  totalExperiences?: number;
  responseTime?: string;
  verified?: boolean;
  superHost?: boolean;
}

interface PremiumHostCardProps {
  host: Host;
  onContact?: () => void;
  onViewProfile?: () => void;
  className?: string;
}

export const PremiumHostCard = ({
  host,
  onContact,
  onViewProfile,
  className,
}: PremiumHostCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer group",
          "bg-gradient-to-br from-card to-primary/5 border-primary/10",
          "hover:shadow-lg hover:border-primary/20 transition-all duration-300",
          className
        )}
        onClick={onViewProfile}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar with glow effect */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20 blur-md"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <Avatar className="h-16 w-16 relative ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <AvatarImage src={host.image || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {host.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {host.verified && (
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary">
                  <Shield className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold truncate">{host.name}</p>
                {host.superHost && (
                  <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                    Superhost
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {host.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{host.rating}</span>
                  </div>
                )}
                {host.totalExperiences && (
                  <>
                    <span>•</span>
                    <span>{host.totalExperiences} experiences</span>
                  </>
                )}
              </div>

              {host.responseTime && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{host.responseTime}</span>
                </div>
              )}
            </div>

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>

          {/* Contact Button */}
          {onContact && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onContact();
              }}
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-primary/10 text-primary font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Host
            </motion.button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
