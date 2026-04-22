import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Car, Check, LayoutGrid, Layers, ArrowUpDown, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRideBids, acceptBid } from "@/services/rideService";
import type { RideBid } from "@/types/ride";
import { toast } from "sonner";
import { BidCarousel } from "./BidCarousel";
import { cn } from "@/lib/utils";

interface DriverBidsListProps {
  rideRequestId: string;
  onBidAccepted: (rideId: string) => void;
}

type ViewMode = 'carousel' | 'list';
type SortBy = 'price' | 'eta' | 'rating';

export const DriverBidsList = ({ rideRequestId, onBidAccepted }: DriverBidsListProps) => {
  const [bids, setBids] = useState<RideBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('carousel');
  const [newBidId, setNewBidId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('price');

  // Sort bids based on selected criteria
  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.bid_amount - b.bid_amount; // Lowest first
        case 'eta':
          return a.eta_minutes - b.eta_minutes; // Fastest first
        case 'rating':
          return (b.driver?.rating || 0) - (a.driver?.rating || 0); // Highest first
        default:
          return 0;
      }
    });
  }, [bids, sortBy]);

  const fetchBids = async () => {
    const { data } = await getRideBids(rideRequestId);
    setBids(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBids();

    // Subscribe to real-time bid updates
    const channel = supabase
      .channel(`bids-${rideRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_bids',
          filter: `ride_request_id=eq.${rideRequestId}`,
        },
        async (payload) => {
          console.log('New bid received:', payload);
          // Fetch the full bid with driver info
          const { data } = await supabase
            .from('ride_bids')
            .select('*, driver:drivers(*)')
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            const newBid = data as RideBid;
            setNewBidId(newBid.id);
            setBids(prev => [...prev, newBid].sort((a, b) => a.bid_amount - b.bid_amount));
            toast.info("New bid received!", {
              description: `${newBid.driver?.full_name} offered R${newBid.bid_amount}`,
            });
            
            // Clear new bid highlight after animation
            setTimeout(() => setNewBidId(null), 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideRequestId]);

  const handleAcceptBid = async (bid: RideBid) => {
    setAccepting(bid.id);
    const { data, error } = await acceptBid(bid.id, rideRequestId);
    setAccepting(null);

    if (error) {
      toast.error("Failed to accept bid");
      return;
    }

    if (data) {
      toast.success("Driver accepted! They're on their way.");
      onBidAccepted(data.id);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bids.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Car className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg">Waiting for driver bids...</h3>
            <p className="text-sm text-muted-foreground">
              Drivers in your area are reviewing your request
            </p>
            <div className="flex justify-center gap-1 pt-2">
              {[0, 1, 2].map(i => (
                <span 
                  key={i} 
                  className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with view toggle and sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">
            {bids.length} Driver{bids.length !== 1 ? 's' : ''} Available
          </h3>
          <Badge variant="secondary" className="animate-pulse bg-green-500/10 text-green-600 border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-ping" />
            Live
          </Badge>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-md",
              viewMode === 'carousel' && "bg-background shadow-sm"
            )}
            onClick={() => setViewMode('carousel')}
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-md",
              viewMode === 'list' && "bg-background shadow-sm"
            )}
            onClick={() => setViewMode('list')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'price' as SortBy, label: 'Price', icon: DollarSign },
          { id: 'eta' as SortBy, label: 'ETA', icon: Clock },
          { id: 'rating' as SortBy, label: 'Rating', icon: Star },
        ].map((option) => (
          <Button
            key={option.id}
            variant={sortBy === option.id ? 'default' : 'outline'}
            size="sm"
            className={cn(
              "gap-1.5 shrink-0 rounded-full h-8",
              sortBy === option.id && "shadow-sm"
            )}
            onClick={() => setSortBy(option.id)}
          >
            <option.icon className="h-3.5 w-3.5" />
            {option.label}
            {sortBy === option.id && (
              <ArrowUpDown className="h-3 w-3 ml-0.5" />
            )}
          </Button>
        ))}
      </div>

      {/* Bids Display */}
      {viewMode === 'carousel' ? (
        <BidCarousel 
          bids={sortedBids} 
          onAcceptBid={handleAcceptBid} 
          acceptingBidId={accepting}
          newBidId={newBidId}
        />
      ) : (
        <div className="grid gap-3">
          {sortedBids.map((bid, index) => (
            <Card key={bid.id} className={cn(
              "transition-all",
              index === 0 && "border-primary ring-1 ring-primary/20",
              bid.id === newBidId && "ring-2 ring-green-500 animate-pulse"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={bid.driver?.profile_photo_url} />
                    <AvatarFallback>
                      {bid.driver?.full_name?.split(' ').map(n => n[0]).join('') || 'DR'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{bid.driver?.full_name}</span>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs">{bid.driver?.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Car className="h-3 w-3" />
                      <span>{bid.driver?.vehicle_make} {bid.driver?.vehicle_model}</span>
                      <span className="text-xs">• {bid.driver?.license_plate}</span>
                    </div>
                    {bid.message && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{bid.message}"</p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">R{bid.bid_amount}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{bid.eta_minutes} min away</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full mt-3"
                  onClick={() => handleAcceptBid(bid)}
                  disabled={accepting !== null}
                >
                  {accepting === bid.id ? (
                    "Accepting..."
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Accept This Driver
                    </>
                  )}
                </Button>

                {index === 0 && (
                  <p className="text-xs text-center text-primary mt-2">
                    ⭐ Best offer available
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverBidsList;
