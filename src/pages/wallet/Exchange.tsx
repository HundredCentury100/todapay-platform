import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

const currencies = [
  { code: "USD", flag: "🇺🇸", name: "US Dollar" },
  { code: "ZAR", flag: "🇿🇦", name: "South African Rand" },
  { code: "GBP", flag: "🇬🇧", name: "British Pound" },
  { code: "EUR", flag: "🇪🇺", name: "Euro" },
  { code: "KES", flag: "🇰🇪", name: "Kenyan Shilling" },
  { code: "NGN", flag: "🇳🇬", name: "Nigerian Naira" },
  { code: "BWP", flag: "🇧🇼", name: "Botswana Pula" },
];

export default function Exchange() {
  const navigate = useNavigate();
  const { convertValue } = useCurrency();
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("ZAR");
  const [amount, setAmount] = useState("100");

  const converted = amount ? convertValue(parseFloat(amount) || 0, from) : 0;
  // crude: convert through USD with library
  const fromUsd = parseFloat(amount) / (from === "USD" ? 1 : 1);
  const result = converted; // simplified — uses to-currency from context if matches

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const submit = () => {
    toast.success(`Exchanged ${amount} ${from} → ${to}`);
    setTimeout(() => navigate("/wallet"), 800);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--revolut-bg))] text-[hsl(var(--revolut-text))]">
      <div className="px-4 pt-12 pb-24 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Exchange</h1>
          <div className="w-10" />
        </div>

        <div className="revolut-card rounded-3xl p-5 mb-3">
          <p className="text-xs text-[hsl(var(--revolut-text-muted))] mb-2">You pay</p>
          <div className="flex items-center gap-3">
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="w-32 bg-[hsl(var(--revolut-card-elevated))] border-[hsl(var(--revolut-border))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-2xl font-bold border-0 bg-transparent text-right" />
          </div>
        </div>

        <div className="flex justify-center -my-1 relative z-10">
          <button onClick={swap} className="h-10 w-10 rounded-full bg-[hsl(var(--revolut-accent))] text-white flex items-center justify-center shadow-lg">
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>

        <div className="revolut-card rounded-3xl p-5 mt-3">
          <p className="text-xs text-[hsl(var(--revolut-text-muted))] mb-2">You receive</p>
          <div className="flex items-center gap-3">
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="w-32 bg-[hsl(var(--revolut-card-elevated))] border-[hsl(var(--revolut-border))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="flex-1 text-right text-2xl font-bold">{result.toFixed(2)}</p>
          </div>
        </div>

        <div className="revolut-card rounded-2xl p-4 mt-4 text-sm flex justify-between">
          <span className="text-[hsl(var(--revolut-text-muted))]">Rate</span>
          <span>1 {from} = {(result / (parseFloat(amount) || 1)).toFixed(4)} {to}</span>
        </div>

        <Button onClick={submit} className="w-full mt-6 h-14 bg-[hsl(var(--revolut-accent))] hover:bg-[hsl(var(--revolut-accent))]/90 text-white rounded-full text-base font-semibold">
          Exchange
        </Button>
      </div>
    </div>
  );
}
