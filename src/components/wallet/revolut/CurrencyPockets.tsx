import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface Pocket {
  currency: string;
  symbol: string;
  flag: string;
  balance: number;
}

interface CurrencyPocketsProps {
  pockets: Pocket[];
  activeCurrency: string;
  onSelect?: (currency: string) => void;
}

export function CurrencyPockets({ pockets, activeCurrency, onSelect }: CurrencyPocketsProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-3 min-w-max">
        {pockets.map((p) => {
          const active = p.currency === activeCurrency;
          return (
            <button
              key={p.currency}
              onClick={() => onSelect?.(p.currency)}
              className={`flex flex-col items-center gap-1.5 transition-transform ${active ? "scale-105" : ""}`}
            >
              <div
                className={`h-14 w-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                  active
                    ? "border-[hsl(var(--revolut-accent))] bg-[hsl(var(--revolut-card-elevated))]"
                    : "border-[hsl(var(--revolut-border))] bg-[hsl(var(--revolut-card))]"
                }`}
              >
                {p.flag}
              </div>
              <span className="text-xs font-semibold text-[hsl(var(--revolut-text))]">{p.currency}</span>
              <span className="text-[10px] text-[hsl(var(--revolut-text-muted))]">
                {p.symbol}
                {p.balance.toFixed(2)}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => navigate("/wallet/exchange")}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="h-14 w-14 rounded-full border-2 border-dashed border-[hsl(var(--revolut-border))] flex items-center justify-center text-[hsl(var(--revolut-text-muted))]">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-xs text-[hsl(var(--revolut-text-muted))]">Add</span>
        </button>
      </div>
    </div>
  );
}
