import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Snowflake, Trash2, Eye, EyeOff, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function VirtualCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!user) return;
    supabase.from("virtual_cards").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setCards(data || []));
  };

  useEffect(load, [user]);

  const create = async () => {
    if (!user) return;
    setBusy(true);
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    const cardNum = `4${Math.floor(100000000000000 + Math.random() * 900000000000000)}`.slice(0, 16);
    const cvv = String(Math.floor(100 + Math.random() * 900));
    const now = new Date();
    const { error } = await supabase.from("virtual_cards").insert({
      user_id: user.id,
      card_name: "Virtual Card",
      last4,
      card_number_encrypted: cardNum, // demo only
      cvv_encrypted: cvv,
      expiry_month: now.getMonth() + 1,
      expiry_year: now.getFullYear() + 3,
      currency: "USD",
    });
    setBusy(false);
    if (error) return toast.error("Failed");
    toast.success("Virtual card created");
    load();
  };

  const toggleFreeze = async (c: any) => {
    await supabase.from("virtual_cards").update({ is_frozen: !c.is_frozen }).eq("id", c.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("virtual_cards").delete().eq("id", id);
    load();
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--revolut-bg))] text-[hsl(var(--revolut-text))]">
      <div className="px-4 pt-12 pb-24 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Cards</h1>
          <button onClick={create} disabled={busy} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {cards.length === 0 && (
          <div className="revolut-card rounded-3xl p-8 text-center">
            <p className="text-sm text-[hsl(var(--revolut-text-muted))] mb-4">Generate a virtual card for safe online payments.</p>
            <Button onClick={create} disabled={busy} className="bg-[hsl(var(--revolut-accent))] text-white rounded-full">
              <Plus className="h-4 w-4 mr-1" /> Create card
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {cards.map((c) => {
            const r = reveal[c.id];
            const cardNum = c.card_number_encrypted.replace(/(\d{4})/g, "$1 ").trim();
            return (
              <div key={c.id} className="space-y-3">
                <div className={`relative rounded-3xl p-6 aspect-[1.6/1] overflow-hidden ${c.is_frozen ? "opacity-50" : ""}`} style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)" }}>
                  <div className="flex justify-between items-start text-white">
                    <p className="font-semibold">{c.card_name}</p>
                    <Wifi className="h-5 w-5 rotate-90" />
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <p className="font-mono text-lg tracking-widest mb-3">{r ? cardNum : `•••• •••• •••• ${c.last4}`}</p>
                    <div className="flex justify-between text-xs">
                      <div>
                        <p className="opacity-60">EXP</p>
                        <p>{String(c.expiry_month).padStart(2, "0")}/{String(c.expiry_year).slice(-2)}</p>
                      </div>
                      <div>
                        <p className="opacity-60">CVV</p>
                        <p>{r ? c.cvv_encrypted : "•••"}</p>
                      </div>
                      <p className="text-base font-bold italic">VISA</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setReveal({ ...reveal, [c.id]: !r })} className="flex-1 border-[hsl(var(--revolut-border))] bg-[hsl(var(--revolut-card))] text-[hsl(var(--revolut-text))]">
                    {r ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />} {r ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleFreeze(c)} className="flex-1 border-[hsl(var(--revolut-border))] bg-[hsl(var(--revolut-card))] text-[hsl(var(--revolut-text))]">
                    <Snowflake className="h-4 w-4 mr-1" /> {c.is_frozen ? "Unfreeze" : "Freeze"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(c.id)} className="border-[hsl(var(--revolut-border))] bg-[hsl(var(--revolut-card))] text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
