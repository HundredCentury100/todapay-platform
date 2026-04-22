import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, MessageCircle, Clock, Shield } from "lucide-react";

interface HostProfileCardProps {
  hostName: string;
  reviewScore?: number;
  reviewCount?: number;
  responseRate?: number;
  isSuperhost?: boolean;
  joinedYear?: number;
}

export const HostProfileCard = ({
  hostName,
  reviewScore,
  reviewCount = 0,
  responseRate = 95,
  isSuperhost = false,
  joinedYear,
}: HostProfileCardProps) => {
  // Derive superhost from review data
  const superhost = isSuperhost || (reviewScore && reviewScore >= 4.5 && reviewCount >= 10);
  const isTopHost = reviewScore && reviewScore >= 4.8 && reviewCount >= 10;

  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Host Avatar */}
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {hostName.charAt(0).toUpperCase()}
            </div>
            {superhost && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-0.5">
                <Award className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Host Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">Hosted by {hostName}</h3>
              {isTopHost && (
                <Badge variant="secondary" className="text-xs gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">
                  <Award className="h-3 w-3" />
                  Top Host
                </Badge>
              )}
              {superhost && !isTopHost && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Award className="h-3 w-3" />
                  Superhost
                </Badge>
              )}
            </div>
            {joinedYear && (
              <p className="text-sm text-muted-foreground mb-3">
                Hosting since {joinedYear}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              {reviewCount > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>{reviewCount} reviews</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{responseRate}% response rate</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Responds within an hour</span>
              </div>
            </div>
          </div>
        </div>

        {isTopHost && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{hostName}</strong> is a Top Host. 
              Top Hosts are experienced, highly rated hosts who consistently deliver outstanding guest experiences.
            </p>
          </div>
        )}
        {superhost && !isTopHost && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{hostName}</strong> is a Superhost. 
              Superhosts are experienced, highly rated hosts who are committed to providing great stays.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
