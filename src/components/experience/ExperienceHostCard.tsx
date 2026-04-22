import { motion } from "framer-motion";
import { Star, Shield, Clock, MessageSquare, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ExperienceHostCardProps {
  host: {
    name: string;
    image?: string | null;
    rating: number;
    totalExperiences: number;
    responseTime: string;
    verified: boolean;
  };
  onContact?: () => void;
}

const ExperienceHostCard = ({ host, onContact }: ExperienceHostCardProps) => {
  const isTopHost = host.rating >= 4.8 && host.totalExperiences >= 10;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card className="border-border/50 bg-gradient-to-br from-card to-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={host.image || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {host.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">Hosted by {host.name}</h3>
                {isTopHost && (
                  <Badge variant="secondary" className="gap-1 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">
                    <Award className="h-3 w-3" /> Top Host
                  </Badge>
                )}
                {host.verified && !isTopHost && (
                  <Badge variant="secondary" className="gap-1 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                    <Shield className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {host.rating.toFixed(1)}
                </span>
                <span>•</span>
                <span>{host.totalExperiences} experiences</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Responds {host.responseTime.toLowerCase()}</span>
              </div>
            </div>
          </div>
          {onContact && (
            <Button variant="outline" size="sm" className="w-full mt-3 gap-2" onClick={onContact}>
              <MessageSquare className="h-4 w-4" /> Contact Host
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExperienceHostCard;
