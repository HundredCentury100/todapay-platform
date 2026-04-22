import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, MessageCircle, Clock, Laptop } from "lucide-react";

interface WorkspaceHostCardProps {
  hostName: string;
  totalSpaces?: number;
  reviewCount?: number;
  reviewScore?: number;
  responseRate?: number;
}

export const WorkspaceHostCard = ({
  hostName,
  totalSpaces = 1,
  reviewCount = 0,
  reviewScore,
  responseRate = 95,
}: WorkspaceHostCardProps) => {
  const isTopProvider = reviewScore && reviewScore >= 4.5 && reviewCount >= 5;

  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {hostName.charAt(0).toUpperCase()}
            </div>
            {isTopProvider && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-0.5">
                <Award className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">Managed by {hostName}</h3>
              {isTopProvider && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Award className="h-3 w-3" />
                  Top Provider
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm mt-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Laptop className="h-4 w-4" />
                <span>{totalSpaces} space{totalSpaces !== 1 ? 's' : ''}</span>
              </div>
              {reviewCount > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>{reviewCount} reviews</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{responseRate}% response rate</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
