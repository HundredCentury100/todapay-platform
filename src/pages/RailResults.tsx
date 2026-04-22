import { useState } from "react";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { useSearchParams } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Train, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/ui/empty-state";
import MobileAppLayout from "@/components/MobileAppLayout";
import { toast } from "sonner";

const mockTrains = [
  { id: "1", operator: "NRZ Express", from: "Harare", to: "Bulawayo", departureTime: "07:00", arrivalTime: "17:00", duration: "10h", price: 35, class: "Economy", stops: 3 },
  { id: "2", operator: "NRZ Sleeper", from: "Harare", to: "Bulawayo", departureTime: "21:00", arrivalTime: "06:00", duration: "9h", price: 50, class: "Sleeper", stops: 2 },
  { id: "3", operator: "NRZ Express", from: "Bulawayo", to: "Victoria Falls", departureTime: "19:00", arrivalTime: "06:00", duration: "11h", price: 40, class: "Economy", stops: 4 },
  { id: "4", operator: "NRZ Commuter", from: "Harare", to: "Mutare", departureTime: "06:30", arrivalTime: "14:00", duration: "7h 30m", price: 20, class: "Economy", stops: 5 },
  { id: "5", operator: "NRZ Express", from: "Harare", to: "Masvingo", departureTime: "08:00", arrivalTime: "14:00", duration: "6h", price: 25, class: "Economy", stops: 2 },
];

const RailResults = () => {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("price_low");

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";

  const trains = [...mockTrains]
    .map(t => ({ ...t, from: from || t.from, to: to || t.to }))
    .sort((a, b) => sortBy === "price_low" ? a.price - b.price : b.price - a.price);

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
                <p className="text-xs text-muted-foreground">{date ? format(new Date(date), "EEE, MMM d") : "Any date"}</p>
              </div>
            </div>
            <ServiceProgressBar currentStep={2} className="mt-2" />
            <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
              {sortOptions.map(o => (
                <button key={o.value} onClick={() => setSortBy(o.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${sortBy === o.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {trains.length === 0 ? (
            <EmptyState type="no-results" title="No trains found" description="Try different routes or dates" />
          ) : (
            trains.map((train, idx) => (
              <motion.div key={train.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="rounded-2xl p-4 hover:shadow-lg transition-all active:scale-[0.98]" onClick={() => toast.info("Train booking details coming soon!")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Train className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-semibold text-sm">{train.operator}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{train.class}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-xl font-bold">{train.departureTime}</p>
                      <p className="text-xs text-muted-foreground">{train.from}</p>
                    </div>
                    <div className="flex-1 px-4 flex flex-col items-center">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{train.duration}</p>
                      <div className="w-full h-px bg-border relative my-1">
                        <ArrowRight className="h-3 w-3 text-muted-foreground absolute right-0 -top-1.5" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{train.stops} stops</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{train.arrivalTime}</p>
                      <p className="text-xs text-muted-foreground">{train.to}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <p className="text-lg font-bold text-primary">${train.price}</p>
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

export default RailResults;
