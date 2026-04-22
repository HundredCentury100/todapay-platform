import { useState } from "react";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { useSearchParams } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, ArrowRight, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/ui/empty-state";
import MobileAppLayout from "@/components/MobileAppLayout";
import { toast } from "sonner";

// Mock data for flights - Zimbabwe routes
const mockFlights = [
  { id: "1", airline: "Air Zimbabwe", from: "Harare", to: "Johannesburg", departureTime: "06:30", arrivalTime: "08:45", duration: "2h 15m", price: 245, stops: 0, aircraft: "Boeing 737" },
  { id: "2", airline: "Fastjet Zimbabwe", from: "Harare", to: "Victoria Falls", departureTime: "08:00", arrivalTime: "09:30", duration: "1h 30m", price: 120, stops: 0, aircraft: "Embraer E145" },
  { id: "3", airline: "Air Zimbabwe", from: "Harare", to: "Bulawayo", departureTime: "10:15", arrivalTime: "11:15", duration: "1h 00m", price: 95, stops: 0, aircraft: "ERJ-145" },
  { id: "4", airline: "Air Zimbabwe", from: "Bulawayo", to: "Victoria Falls", departureTime: "14:00", arrivalTime: "15:15", duration: "1h 15m", price: 110, stops: 0, aircraft: "ERJ-145" },
  { id: "5", airline: "Fastjet Zimbabwe", from: "Victoria Falls", to: "Harare", departureTime: "16:00", arrivalTime: "17:30", duration: "1h 30m", price: 115, stops: 0, aircraft: "Embraer E145" },
  { id: "6", airline: "Air Zimbabwe", from: "Harare", to: "Kariba", departureTime: "09:00", arrivalTime: "10:00", duration: "1h 00m", price: 85, stops: 0, aircraft: "Cessna Caravan" },
  { id: "7", airline: "Fastjet Zimbabwe", from: "Harare", to: "Bulawayo", departureTime: "12:30", arrivalTime: "13:30", duration: "1h 00m", price: 90, stops: 0, aircraft: "Embraer E145" },
  { id: "8", airline: "Air Zimbabwe", from: "Victoria Falls", to: "Bulawayo", departureTime: "17:00", arrivalTime: "18:15", duration: "1h 15m", price: 105, stops: 0, aircraft: "ERJ-145" },
];

const FlightResults = () => {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("price_low");

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const cabin = searchParams.get("cabin") || "economy";

  const flights = [...mockFlights]
    .map(f => ({ ...f, from: from || f.from, to: to || f.to }))
    .sort((a, b) => sortBy === "price_low" ? a.price - b.price : sortBy === "price_high" ? b.price - a.price : 0);

  const sortOptions = [
    { value: "price_low", label: "Cheapest" },
    { value: "price_high", label: "Most Expensive" },
    { value: "duration", label: "Fastest" },
  ];

  return (
    <MobileAppLayout onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-40 bg-background border-b safe-area-pt">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <BackButton fallbackPath="/" />
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-lg">{from || "Origin"} → {to || "Destination"}</h1>
                <p className="text-xs text-muted-foreground">
                  {date ? format(new Date(date), "EEE, MMM d") : "Any date"} · {cabin}
                </p>
              </div>
            </div>
            <ServiceProgressBar currentStep={2} className="pt-2" />
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
              {sortOptions.map(o => (
                <button key={o.value} onClick={() => setSortBy(o.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${sortBy === o.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {flights.length === 0 ? (
            <EmptyState type="no-results" title="No flights found" description="Try different dates or destinations" />
          ) : (
            flights.map((flight, idx) => (
              <motion.div key={flight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="rounded-2xl p-4 hover:shadow-lg transition-all active:scale-[0.98]" onClick={() => toast.info("Flight booking details coming soon!")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Plane className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-semibold text-sm">{flight.airline}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{flight.aircraft}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-xl font-bold">{flight.departureTime}</p>
                      <p className="text-xs text-muted-foreground">{flight.from}</p>
                    </div>
                    <div className="flex-1 px-4 flex flex-col items-center">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{flight.duration}</p>
                      <div className="w-full h-px bg-border relative my-1">
                        <ArrowRight className="h-3 w-3 text-muted-foreground absolute right-0 -top-1.5" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{flight.stops === 0 ? "Direct" : `${flight.stops} stop`}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{flight.arrivalTime}</p>
                      <p className="text-xs text-muted-foreground">{flight.to}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <p className="text-lg font-bold text-primary">${flight.price}</p>
                    <Button size="sm" className="rounded-xl">Select</Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default FlightResults;
