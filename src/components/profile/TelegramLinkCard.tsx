import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, LinkIcon, Unlink, CheckCircle2, Loader2 } from "lucide-react";

export function TelegramLinkCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [linkCode, setLinkCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const { data: telegramLink, isLoading } = useQuery({
    queryKey: ["telegram-link", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("telegram_user_links")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLink = async () => {
    if (!user?.id || !linkCode.trim()) return;
    setIsLinking(true);

    try {
      // Find pending link with this code
      const { data: pendingLink, error: findErr } = await supabase
        .from("telegram_user_links")
        .select("*")
        .eq("link_code", linkCode.trim())
        .eq("status", "pending")
        .single();

      if (findErr || !pendingLink) {
        toast.error("Invalid or expired code. Please generate a new one from Telegram.");
        setIsLinking(false);
        return;
      }

      // Check expiry
      if (new Date(pendingLink.link_code_expires_at) < new Date()) {
        toast.error("This code has expired. Send /start in Telegram to get a new one.");
        setIsLinking(false);
        return;
      }

      // Update the link with the actual user_id and activate
      const { error: updateErr } = await supabase
        .from("telegram_user_links")
        .update({
          user_id: user.id,
          status: "active",
          link_code: null,
          link_code_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingLink.id);

      if (updateErr) {
        if (updateErr.message.includes("duplicate")) {
          toast.error("Your account is already linked to a Telegram account.");
        } else {
          throw updateErr;
        }
        setIsLinking(false);
        return;
      }

      toast.success("Telegram linked successfully! 🎉");
      setLinkCode("");
      queryClient.invalidateQueries({ queryKey: ["telegram-link"] });
    } catch (err: any) {
      console.error("Link error:", err);
      toast.error("Failed to link Telegram account.");
    }
    setIsLinking(false);
  };

  const handleUnlink = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from("telegram_user_links")
      .update({ status: "unlinked" })
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      toast.error("Failed to unlink.");
    } else {
      toast.success("Telegram unlinked.");
      queryClient.invalidateQueries({ queryKey: ["telegram-link"] });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card border border-border/50 p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (telegramLink) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border/50 p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-[#0088cc]/10 flex items-center justify-center">
            <Send className="h-5 w-5 text-[#0088cc]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Telegram Connected</p>
            <p className="text-xs text-muted-foreground">
              @{telegramLink.telegram_username || "linked"}
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleUnlink}
        >
          <Unlink className="h-4 w-4" />
          Unlink Telegram
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border/50 p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-[#0088cc]/10 flex items-center justify-center">
          <Send className="h-5 w-5 text-[#0088cc]" />
        </div>
        <div>
          <p className="text-sm font-semibold">Link Telegram</p>
          <p className="text-xs text-muted-foreground">
            Get bookings & notifications via Telegram
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3 space-y-1">
          <p>1. Search <b>@todapay_bot</b> on Telegram</p>
          <p>2. Send <code>/start</code> to get a link code</p>
          <p>3. Enter the code below</p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter 6-digit code"
            value={linkCode}
            onChange={(e) => setLinkCode(e.target.value)}
            maxLength={6}
            className="text-center font-mono tracking-widest"
          />
          <Button
            onClick={handleLink}
            disabled={linkCode.length !== 6 || isLinking}
            className="gap-2"
          >
            {isLinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
            Link
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
