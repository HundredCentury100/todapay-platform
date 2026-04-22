import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserWallet } from "@/hooks/useUserWallet";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Statements() {
  const navigate = useNavigate();
  const { transactions, wallet } = useUserWallet();

  const exportCSV = () => {
    const rows = [
      ["Date", "Type", "Description", "Amount", "Balance After"],
      ...transactions.map((t) => [
        format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
        t.transaction_type,
        t.description || "",
        t.amount.toString(),
        t.balance_after.toString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallet-statement-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Statement downloaded");
  };

  // Group by month
  const byMonth = new Map<string, typeof transactions>();
  transactions.forEach((t) => {
    const key = format(new Date(t.created_at), "MMMM yyyy");
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(t);
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--revolut-bg))] text-[hsl(var(--revolut-text))]">
      <div className="px-4 pt-12 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Statements</h1>
          <div className="w-10" />
        </div>

        <Button onClick={exportCSV} className="w-full mb-4 h-12 bg-[hsl(var(--revolut-accent))] text-white rounded-full">
          <Download className="h-4 w-4 mr-2" /> Export full history (CSV)
        </Button>

        <div className="space-y-3">
          {Array.from(byMonth.entries()).map(([month, txns]) => {
            const totalIn = txns.filter((t) => ["topup", "credit", "reward", "refund"].includes(t.transaction_type)).reduce((s, t) => s + t.amount, 0);
            const totalOut = txns.filter((t) => ["payment", "debit", "transfer"].includes(t.transaction_type)).reduce((s, t) => s + Math.abs(t.amount), 0);
            return (
              <div key={month} className="revolut-card rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--revolut-accent))]/15 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[hsl(var(--revolut-accent))]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{month}</p>
                  <p className="text-xs text-[hsl(var(--revolut-text-muted))]">{txns.length} transactions · in ${totalIn.toFixed(2)} · out ${totalOut.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <div className="revolut-card rounded-3xl p-8 text-center">
              <p className="text-sm text-[hsl(var(--revolut-text-muted))]">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
