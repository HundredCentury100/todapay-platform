import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFeaturedWorkspaces, WorkspaceData } from "@/services/workspaceService";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Briefcase, MapPin, Users, Wifi, Monitor, Coffee, Car, Clock, TrendingUp, Star } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

// Mock workspaces for fallback - Zimbabwe focused
const mockWorkspaces = [
  {
    id: "ws-1",
    name: "Impact Hub Harare",
    workspace_type: "coworking",
    city: "Harare",
    country: "Zimbabwe",
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"],
    amenities: ["wifi", "meeting_rooms", "coffee", "parking"],
    hourly_rate: 8,
    capacity: 80,
    trending: true,
    rating: 4.7,
    reviewCount: 234,
    region: "Zimbabwe",
  },
];

const WORKSPACE_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  coworking: { label: "Co-working", emoji: "💻" },
  serviced_office: { label: "Office", emoji: "🏢" },
  meeting_room: { label: "Meeting Room", emoji: "👥" },
  innovation_hub: { label: "Innovation Hub", emoji: "🚀" },
  hot_desk: { label: "Hot Desk", emoji: "🪑" },
  private_office: { label: "Private Office", emoji: "🔒" },
};

const getAmenityIcon = (amenity: string) => {
  const icons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="w-3 h-3" />,
    meeting_rooms: <Monitor className="w-3 h-3" />,
    coffee: <Coffee className="w-3 h-3" />,
    parking: <Car className="w-3 h-3" />,
  };
  return icons[amenity.toLowerCase()] || null;
};

interface FeaturedWorkspaceCardsProps {
  limit?: number;
}

export const FeaturedWorkspaceCards = ({ limit }: FeaturedWorkspaceCardsProps) => {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const data = await getFeaturedWorkspaces(limit || 8);
        setWorkspaces(data.length > 0 ? data : mockWorkspaces.slice(0, limit || 8));
      } catch (error) {
        console.error("Error fetching featured workspaces:", error);
        setWorkspaces(mockWorkspaces.slice(0, limit || 8));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, [limit]);

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${limit ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        {Array.from({ length: limit || 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <Skeleton className="h-36 w-full" />
            <div className="p-3.5 space-y-2.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No workspaces available yet</h3>
        <p className="text-sm text-muted-foreground">Check back soon!</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${limit ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
};

const WorkspaceCard = ({ workspace }: { workspace: any }) => {
  const { convertPrice } = useCurrency();
  const typeInfo = WORKSPACE_TYPE_LABELS[workspace.workspace_type] || { label: workspace.workspace_type, emoji: "💼" };

  return (
    <Link to={`/workspaces/${workspace.id}`}>
      <div className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative h-36 overflow-hidden">
          <ImageCarousel
            images={workspace.images || []}
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                <Briefcase className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
            }
            className="h-36"
          />
          
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5">
            {workspace.trending && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 font-semibold shadow-lg">
                <TrendingUp className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
            <Badge className="bg-background/90 text-[10px] px-2 py-0.5 shadow-md">
              {typeInfo.emoji} {typeInfo.label}
            </Badge>
          </div>

          {/* Rating */}
          {workspace.rating && (
            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 shadow-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold">{workspace.rating}</span>
            </div>
          )}

          {/* Region Badge */}
          {workspace.region && (
            <div className="absolute bottom-2.5 left-2.5 z-10">
              <Badge variant="outline" className="bg-background/90 text-[10px] px-2 py-0.5 shadow-md">
                {workspace.region}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3.5 space-y-2.5 flex-1">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">{workspace.name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{workspace.city}, {workspace.country}</span>
            </div>
          </div>

          {/* Capacity */}
          {workspace.capacity && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>Up to {workspace.capacity} people</span>
            </div>
          )}

          {/* Amenities */}
          {workspace.amenities && workspace.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {workspace.amenities.slice(0, 4).map((amenity: string) => (
                <div key={amenity} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground">
                  {getAmenityIcon(amenity)}
                  <span className="capitalize">{amenity.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3.5 pb-3.5 flex items-center justify-between border-t border-border/30 pt-2.5 mt-auto">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            {workspace.hourly_rate ? (
              <p className="text-base font-bold text-primary">
                {convertPrice(workspace.hourly_rate)}<span className="text-xs font-normal text-muted-foreground">/hour</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Contact for price</p>
            )}
          </div>
          <Button size="sm" className="h-8 text-xs rounded-full px-4 shadow-md">
            Book Now
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedWorkspaceCards;
