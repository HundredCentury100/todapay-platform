import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEventSeats, type EventSeat } from "@/services/eventService";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface EventSeatMapProps {
  eventId: string;
  ticketTierId: string;
  onSeatsSelected: (seatIds: string[], seatNumbers: string[]) => void;
  maxSeats?: number;
}

const EventSeatMap = ({
  eventId,
  ticketTierId,
  onSeatsSelected,
  maxSeats = 10,
}: EventSeatMapProps) => {
  const [seats, setSeats] = useState<EventSeat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeats();
  }, [eventId, ticketTierId]);

  const fetchSeats = async () => {
    setLoading(true);
    const { data, error } = await getEventSeats(eventId, ticketTierId);
    if (!error && data) {
      setSeats(data as EventSeat[]);
    }
    setLoading(false);
  };

  const handleSeatClick = (seat: EventSeat) => {
    if (seat.status === "booked" || seat.status === "cash_reserved") return;

    let newSelectedSeats: string[];
    if (selectedSeats.includes(seat.id)) {
      newSelectedSeats = selectedSeats.filter((id) => id !== seat.id);
    } else {
      if (selectedSeats.length >= maxSeats) return;
      newSelectedSeats = [...selectedSeats, seat.id];
    }

    setSelectedSeats(newSelectedSeats);
    const seatNumbers = newSelectedSeats.map(
      (id) => seats.find((s) => s.id === id)?.seat_number || ""
    );
    onSeatsSelected(newSelectedSeats, seatNumbers);
  };

  const getSeatColor = (seat: EventSeat) => {
    if (seat.status === "booked") return "bg-muted text-muted-foreground opacity-50";
    if (seat.status === "cash_reserved")
      return "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-2 border-orange-500/50";
    if (selectedSeats.includes(seat.id))
      return "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1 ring-offset-background scale-105";
    return "bg-card border-2 border-border hover:border-primary/50 hover:bg-accent/30 active:scale-95";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (seats.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No seats available for this ticket tier.
        </p>
      </Card>
    );
  }

  const maxRow = Math.max(...seats.map((s) => s.seat_row));
  const maxCol = Math.max(...seats.map((s) => s.seat_column));

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold mb-3">Select Your Seats</h3>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {[
            { color: "bg-card border-2 border-border", label: "Available" },
            { color: "bg-primary", label: "Selected" },
            { color: "bg-muted opacity-50", label: "Booked" },
            { color: "bg-orange-500/20 border-2 border-orange-500/50", label: "Reserved" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn("w-4 h-4 rounded-sm", color)} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div className="mb-4 text-center">
        <Badge variant="secondary" className="text-xs px-6 py-1.5 rounded-full">
          Stage
        </Badge>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <div className="inline-block min-w-full">
          <div className="space-y-1.5">
            {Array.from({ length: maxRow }, (_, rowIndex) => {
              const rowNumber = rowIndex + 1;
              const rowSeats = seats.filter((s) => s.seat_row === rowNumber);

              return (
                <div key={rowNumber} className="flex items-center gap-1">
                  <span className="text-[10px] font-medium w-5 text-muted-foreground text-center shrink-0">
                    {rowNumber}
                  </span>
                  <div className="flex gap-1 flex-1 justify-center">
                    {Array.from({ length: maxCol }, (_, colIndex) => {
                      const colNumber = colIndex + 1;
                      const seat = rowSeats.find((s) => s.seat_column === colNumber);

                      if (!seat) {
                        return <div key={`${rowNumber}-${colNumber}`} className="w-10 h-10" />;
                      }

                      return (
                        <button
                          key={seat.id}
                          className={cn(
                            "w-10 h-10 rounded-lg text-[11px] font-semibold transition-all duration-150 touch-manipulation select-none",
                            getSeatColor(seat)
                          )}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status === "booked" || seat.status === "cash_reserved"}
                          aria-label={`Seat ${seat.seat_number}, ${seat.status === "booked" ? "booked" : seat.status === "cash_reserved" ? "reserved" : selectedSeats.includes(seat.id) ? "selected" : "available"}`}
                        >
                          {seat.seat_number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selection summary */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-3 border-t"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <span className="font-medium">Selected:</span>{" "}
                {selectedSeats
                  .map((id) => seats.find((s) => s.id === id)?.seat_number)
                  .join(", ")}
              </p>
              <Badge variant="outline" className="text-xs">
                {selectedSeats.length}/{maxSeats}
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default EventSeatMap;
