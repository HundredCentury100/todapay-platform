import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserWallet } from "@/hooks/useUserWallet";
import { toast } from "sonner";

export default function VaultDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { wallet } = useUserWallet();
  const navigate = useNavigate();
  const [vault, setVault] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [mode, setMode] = useState<null | "deposit" | "withdraw">(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id || !user) return;
    const [{ data: v }, { data: txns }] = await Promise.all([
      supabase.from("vaults").select("*").eq("id", id).maybeSingle(),
      supabase.from("vault_transactions").select("*").eq("vault_id", id).order("created_at", { ascending: false }).limit(20),
    ]);
    setVault(v);
    setTransactions(txns || []);
  };

  useEffect(() => { load(); }, [id, user]);

  const submit = async () => {
    if (!user || !vault || !amount) return;
    const amt = parseFloat(amount);
    if (amt <= 0) return;
    setBusy(true);
    const newAmount = mode === "deposit" ? vault.current_amount + amt : Math.max(0, vault.current_amount - amt);
    const { error } = await supabase.from("vaults").update({ current_amount: newAmount }).eq("id", vault.id);
    if (!error) {
      await supabase.from("vault_transactions").insert({
        vault_id: vault.id,
        user_id: user.id,
        transaction_type: mode!,
        amount: amt,
        balance_after: newAmount,
        description: `${mode === "deposit" ? "Deposit" : "Withdrawal"}`,
      });
      toast.success(mode === "deposit" ? "Deposited" : "Withdrawn");
      setMode(null);
      setAmount("");
      load();
    } else toast.error("Failed");
    setBusy(false);
  };

  if (!vault) return <div className="min-h-screen bg-[hsl(var(--revolut-bg))]" />;

  const pct = vault.target_amount > 0 ? Math.min(100, (vault.current_amount / vault.target_amount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[hsl(var(--revolut-bg))] text-[hsl(var(--revolut-text))]">
      <div className="px-4 pt-12 pb-24 max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center mb-6">
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="revolut-hero rounded-3xl p-6 mb-4 text-center">
          <div className="h-16 w-16 rounded-full mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: `${vault.color}25` }}>
            <PiggyBank className="h-8 w-8" style={{ color: vault.color }} />
          </div>
          <p className="text-sm text-[hsl(var(--revolut-text-muted))]">{vault.name}</p>
          <p className="text-4xl font-bold mt-1">${vault.current_amount.toFixed(2)}</p>
          <p className="text-sm text-[hsl(var(--revolut-text-muted))] mt-1">of ${vault.target_amount.toFixed(2)} goal</p>
          <Progress value={pct} className="h-2 mt-4 bg-white/10" />
          <p className="text-xs mt-2">{pct.toFixed(0)}% complete</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button onClick={() => setMode("deposit")} className="bg-[hsl(var(--revolut-accent))] text-white rounded-full h-12">
            <ArrowDownToLine className="h-4 w-4 mr-1" /> Deposit
          </Button>
          <Button onClick={() => setMode("withdraw")} variant="outline" className="rounded-full h-12 border-[hsl(var(--revolut-border))] bg-[hsl(var(--revolut-card))] text-[hsl(var(--revolut-text))] hover:bg-[hsl(var(--revolut-card-elevated))]">
            <ArrowUpFromLine className="h-4 w-4 mr-1" /> Withdraw
          </Button>
        </div>

        <h3 className="text-sm font-semibold mb-3 px-1">History</h3>
        <div className="revolut-card rounded-2xl overflow-hidden">
          {transactions.length === 0 && <p className="p-6 text-center text-sm text-[hsl(var(--revolut-text-muted))]">No transactions yet</p>}
          {transactions.map((t, i) => (
            <div key={t.id} className={`p-3.5 flex justify-between items-center ${i !== transactions.length - 1 ? "border-b border-[hsl(var(--revolut-border))]" : ""}`}>
              <div>
                <p className="text-sm font-medium capitalize">{t.transaction_type}</p>
                <p className="text-xs text-[hsl(var(--revolut-text-muted))]">{new Date(t.created_at).toLocaleDateString()}</p>
              </div>
              <p className={`text-sm font-semibold ${t.transaction_type === "deposit" ? "text-emerald-400" : "text-red-400"}`}>
                {t.transaction_type === "deposit" ? "+" : "-"}${t.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!mode} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="bg-[hsl(var(--revolut-card))] border-[hsl(var(--revolut-border))] text-[hsl(var(--revolut-text))]">
          <DialogHeader>
            <DialogTitle>{mode === "deposit" ? "Deposit to vault" : "Withdraw from vault"}</DialogTitle>
          </DialogHeader>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]" />
          <DialogFooter>
            <Button onClick={submit} disabled={busy || !amount}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
