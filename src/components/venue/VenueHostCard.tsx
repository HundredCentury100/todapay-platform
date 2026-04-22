import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Phone, Shield, Clock, Star } from "lucide-react";

interface VenueHostCardProps {
  businessName: string;
  businessPhone?: string | null;
  responseRate?: number;
  responseTime?: string;
  verified?: boolean;
}

const VenueHostCard = ({
  businessName,
  businessPhone,
  responseRate = 95,
  responseTime = "within 1 hour",
  verified = true,
}: VenueHostCardProps) => {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">
            🏢
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base">{businessName}</h3>
              {verified && (
                <Badge variant="secondary" className="gap-1 text-xs rounded-full">
                  <Shield className="h-3 w-3 text-primary" /> Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Venue Manager</p>

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                <span>{responseRate}% response</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Replies {responseTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1 rounded-full press-effect gap-1.5">
            <MessageCircle className="h-4 w-4" /> Message
          </Button>
          {businessPhone && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full press-effect gap-1.5"
              onClick={() => window.open(`tel:${businessPhone}`)}
            >
              <Phone className="h-4 w-4" /> Call
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VenueHostCard;
