import { Seat } from "@/types/booking";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatSelect: (seatNumber: string) => void;
}

const SeatMap = ({ seats, selectedSeats, onSeatSelect }: SeatMapProps) => {
  const getSeatColor = (seat: Seat) => {
    if (seat.status === "booked")
      return "bg-muted text-muted-foreground cursor-not-allowed opacity-50";
    if (seat.status === "cash_reserved")
      return "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-2 border-orange-500/50 cursor-not-allowed";
    if (selectedSeats.includes(seat.number))
      return "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1 ring-offset-background scale-105";
    if (seat.type === "premium")
      return "bg-accent text-accent-foreground hover:bg-accent/80 active:scale-95";
    return "bg-card border-2 border-border hover:border-primary/50 hover:bg-accent/30 active:scale-95";
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "booked" || seat.status === "cash_reserved") return;
    onSeatSelect(seat.number);
  };

  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<number, Seat[]>);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
        {[
          { color: "bg-card border-2 border-border", label: "Available" },
          { color: "bg-primary", label: "Selected" },
          { color: "bg-muted opacity-50", label: "Booked" },
          { color: "bg-orange-500/20 border-2 border-orange-500/50", label: "Cash Reserved" },
          { color: "bg-accent", label: "Premium" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn("w-4 h-4 rounded-sm", color)} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected count */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-center"
          >
            <Badge variant="default" className="text-xs px-3 py-1">
              {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected: {selectedSeats.join(', ')}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seat grid */}
      <div className="bg-card border border-border rounded-xl p-4 overflow-x-auto -mx-2 px-2">
        <div className="min-w-[260px] max-w-lg mx-auto">
          {/* Front indicator */}
          <div className="flex items-center justify-center mb-3">
            <div className="px-4 py-1.5 bg-muted rounded-full text-xs text-muted-foreground font-medium">
              Front
            </div>
          </div>

          <div className="space-y-1.5">
            {Object.keys(seatsByRow)
              .sort((a, b) => Number(a) - Number(b))
              .map((rowKey) => {
                const row = Number(rowKey);
                const rowSeats = seatsByRow[row].sort((a, b) => a.column - b.column);
                const leftSeats = rowSeats.filter((s) => s.column <= 1);
                const rightSeats = rowSeats.filter((s) => s.column >= 2);

                return (
                  <div key={row} className="flex items-center justify-center gap-1">
                    {/* Row label */}
                    <div className="w-5 text-[10px] text-muted-foreground text-center font-medium shrink-0">
                      {row}
                    </div>

                    {/* Left seats */}
                    <div className="flex gap-1">
                      {leftSeats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status === "booked" || seat.status === "cash_reserved"}
                          aria-label={`Seat ${seat.number}, ${seat.status === "booked" ? "booked" : seat.status === "cash_reserved" ? "reserved" : selectedSeats.includes(seat.number) ? "selected" : "available"}`}
                          className={cn(
                            "w-10 h-10 rounded-lg text-[11px] font-semibold transition-all duration-150 touch-manipulation select-none",
                            getSeatColor(seat)
                          )}
                        >
                          {seat.number}
                        </button>
                      ))}
                    </div>

                    {/* Aisle */}
                    <div className="w-5 shrink-0" />

                    {/* Right seats */}
                    <div className="flex gap-1">
                      {rightSeats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status === "booked" || seat.status === "cash_reserved"}
                          aria-label={`Seat ${seat.number}, ${seat.status === "booked" ? "booked" : seat.status === "cash_reserved" ? "reserved" : selectedSeats.includes(seat.number) ? "selected" : "available"}`}
                          className={cn(
                            "w-10 h-10 rounded-lg text-[11px] font-semibold transition-all duration-150 touch-manipulation select-none",
                            getSeatColor(seat)
                          )}
                        >
                          {seat.number}
                        </button>
                      ))}
                    </div>

                    {/* Driver icon row 1 */}
                    {row === 1 && (
                      <div className="ml-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm shrink-0">
                        🚗
                      </div>
                    )}
                    {row !== 1 && <div className="w-8 shrink-0 ml-1" />}
                  </div>
                );
              })}
          </div>

          {/* Back indicator */}
          <div className="flex items-center justify-center mt-3">
            <div className="px-4 py-1.5 bg-muted rounded-full text-xs text-muted-foreground font-medium">
              Back
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
