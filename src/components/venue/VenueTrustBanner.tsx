import { Shield, Clock, CheckCircle, Smartphone } from "lucide-react";

const VenueTrustBanner = () => {
  const perks = [
    { icon: Shield, text: "Free cancellation up to 48h" },
    { icon: CheckCircle, text: "Verified venue" },
    { icon: Clock, text: "Instant confirmation" },
    { icon: Smartphone, text: "Suvat Pay & O'mari accepted" },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 py-2">
      {perks.map((perk) => (
        <div
          key={perk.text}
          className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-full bg-primary/5 border border-primary/10"
        >
          <perk.icon className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-medium whitespace-nowrap">{perk.text}</span>
        </div>
      ))}
    </div>
  );
};

export default VenueTrustBanner;
