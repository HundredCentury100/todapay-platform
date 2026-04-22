import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, PiggyBank, Plane, Home, Heart, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Vault {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  icon: string;
  color: string;
}

const iconMap: Record<string, typeof PiggyBank> = {
  "piggy-bank": PiggyBank,
  plane: Plane,
  home: Home,
  heart: Heart,
  phone: Smartphone,
  sparkles: Sparkles,
};

export default function Vaults() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("vaults")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setVaults((data as Vault[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const create = async () => {
    if (!user || !name || !target) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("vaults")
      .insert({
        user_id: user.id,
        name,
        target_amount: parseFloat(target),
        currency: "USD",
        icon: "piggy-bank",
        color: "#3B82F6",
      })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast.error("Failed to create vault");
      return;
    }
    setVaults([data as Vault, ...vaults]);
    setOpen(false);
    setName("");
    setTarget("");
    toast.success("Vault created");
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--revolut-bg))] text-[hsl(var(--revolut-text))]">
      <div className="px-4 pt-12 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Vaults</h1>
          <button onClick={() => setOpen(true)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="revolut-card rounded-3xl p-6 mb-6 text-center">
          <div className="h-16 w-16 rounded-full bg-[hsl(var(--revolut-accent))]/15 mx-auto flex items-center justify-center mb-4">
            <PiggyBank className="h-8 w-8 text-[hsl(var(--revolut-accent))]" />
          </div>
          <h2 className="text-xl font-bold mb-1">Save with purpose</h2>
          <p className="text-sm text-[hsl(var(--revolut-text-muted))] mb-4">
            Create vaults to set savings goals and track progress
          </p>
          <Button onClick={() => setOpen(true)} className="bg-[hsl(var(--revolut-accent))] hover:bg-[hsl(var(--revolut-accent))]/90 text-white rounded-full">
            <Plus className="h-4 w-4 mr-1" /> Create vault
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl bg-[hsl(var(--revolut-card))]" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {vaults.map((v) => {
              const Icon = iconMap[v.icon] || PiggyBank;
              const pct = v.target_amount > 0 ? Math.min(100, (v.current_amount / v.target_amount) * 100) : 0;
              return (
                <Link key={v.id} to={`/wallet/vaults/${v.id}`} className="revolut-card rounded-2xl p-4 flex items-center gap-4 hover:bg-[hsl(var(--revolut-card-elevated))] transition-colors">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${v.color}20` }}>
                    <Icon className="h-6 w-6" style={{ color: v.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <p className="font-semibold truncate">{v.name}</p>
                      <p className="text-sm font-medium">${v.current_amount.toFixed(2)}</p>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-[hsl(var(--revolut-border))]" />
                    <p className="text-xs text-[hsl(var(--revolut-text-muted))] mt-1">
                      {pct.toFixed(0)}% of ${v.target_amount.toFixed(2)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[hsl(var(--revolut-card))] border-[hsl(var(--revolut-border))] text-[hsl(var(--revolut-text))]">
          <DialogHeader>
            <DialogTitle>Create new vault</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Goal name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Holiday in Bali" className="bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]" />
            </div>
            <div>
              <Label>Target amount (USD)</Label>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="1000" className="bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={create} disabled={creating || !name || !target}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
