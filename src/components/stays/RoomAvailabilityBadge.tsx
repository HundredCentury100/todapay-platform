import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { checkRoomAvailability, getRoomAvailability } from "@/services/stayService";
import { RoomAvailability } from "@/types/stay";

interface RoomAvailabilityBadgeProps {
  roomId: string;
  checkIn: string;
  checkOut: string;
  requestedUnits?: number;
  roomQuantity: number;
  onAvailabilityChange?: (isAvailable: boolean, availability: RoomAvailability[]) => void;
  onPriceChange?: (dynamicPrice: number | null) => void;
}

const RoomAvailabilityBadge = ({
  roomId,
  checkIn,
  checkOut,
  requestedUnits = 1,
  roomQuantity,
  onAvailabilityChange,
  onPriceChange,
}: RoomAvailabilityBadgeProps) => {
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availableUnits, setAvailableUnits] = useState<number>(roomQuantity);
  const [dynamicPrice, setDynamicPrice] = useState<number | null>(null);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!checkIn || !checkOut) {
        setIsAvailable(true);
        setAvailableUnits(roomQuantity);
        return;
      }

      setLoading(true);
      try {
        const [available, availability] = await Promise.all([
          checkRoomAvailability(roomId, checkIn, checkOut, requestedUnits),
          getRoomAvailability(roomId, checkIn, checkOut),
        ]);

        setIsAvailable(available);

        // Calculate minimum available units across all dates
        if (availability.length > 0) {
          const minAvailable = Math.min(...availability.map(a => a.available_units));
          setAvailableUnits(minAvailable);

          // Calculate average dynamic price if any overrides exist
          const priceOverrides = availability.filter(a => a.price_override);
          if (priceOverrides.length > 0) {
            const avgPrice = priceOverrides.reduce((sum, a) => sum + (a.price_override || 0), 0) / priceOverrides.length;
            setDynamicPrice(avgPrice);
            onPriceChange?.(avgPrice);
          } else {
            setDynamicPrice(null);
            onPriceChange?.(null);
          }
        } else {
          setAvailableUnits(roomQuantity);
          setDynamicPrice(null);
          onPriceChange?.(null);
        }

        onAvailabilityChange?.(available, availability);
      } catch (error) {
        console.error("Error checking availability:", error);
        setIsAvailable(true); // Assume available on error
        setAvailableUnits(roomQuantity);
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [roomId, checkIn, checkOut, requestedUnits, roomQuantity]);

  if (loading) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (!checkIn || !checkOut) {
    return null;
  }

  if (!isAvailable) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Not Available
      </Badge>
    );
  }

  // Show urgency badge for low availability
  if (availableUnits <= 2) {
    return (
      <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
        Only {availableUnits} left!
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
      <CheckCircle className="h-3 w-3" />
      Available
    </Badge>
  );
};

export default RoomAvailabilityBadge;
