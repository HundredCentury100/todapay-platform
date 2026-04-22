import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useUserWallet } from "@/hooks/useUserWallet";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = 'form' | 'confirm' | 'sending' | 'success';

const SendMoney = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet, balance } = useUserWallet();
  const { convertPrice } = useCurrency();

  const [step, setStep] = useState<Step>('form');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const numAmount = Number(amount) || 0;
  const hasEnough = balance >= numAmount;

  const handleLookup = async () => {
    if (!accountNumber.trim()) {
      toast.error('Please enter an account number');
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('account_number', accountNumber.trim().toUpperCase())
      .maybeSingle();

    if (!profile) {
      toast.error('Account not found. Please check the account number.');
      return;
    }
    
    setRecipientName(profile.full_name || 'Unknown User');
  };

  const handleProceed = () => {
    if (!recipientName) {
      toast.error('Please verify the recipient first');
      return;
    }
    if (numAmount < 1) {
      toast.error('Minimum transfer is $1.00');
      return;
    }
    if (!hasEnough) {
      toast.error('Insufficient balance');
      return;
    }
    setStep('confirm');
  };

  const handleSend = async () => {
    if (!wallet?.id) return;
    setStep('sending');
    setIsSending(true);

    try {
      const { data, error } = await supabase.rpc('transfer_between_wallets', {
        p_sender_wallet_id: wallet.id,
        p_recipient_account_number: accountNumber.trim().toUpperCase(),
        p_amount: numAmount,
        p_description: description || 'Wallet transfer',
      });

      if (error) throw error;

      const result = data as any;
      if (!result?.success) {
        throw new Error(result?.error || 'Transfer failed');
      }

      setStep('success');
    } catch (err: any) {
      console.error('Transfer error:', err);
      toast.error(err.message || 'Transfer failed');
      setStep('confirm');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => step === 'form' ? navigate(-1) : setStep('form')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Send Money</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Balance Card */}
              <Card className="border-0 bg-primary/5 rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available Balance</span>
                  <span className="text-lg font-bold text-primary">{convertPrice(balance)}</span>
                </CardContent>
              </Card>

              {/* Recipient */}
              <div className="space-y-2">
                <Label>Recipient Account Number</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. ZW-U-00001"
                    value={accountNumber}
                    onChange={(e) => { setAccountNumber(e.target.value); setRecipientName(null); }}
                    className="uppercase"
                  />
                  <Button variant="outline" onClick={handleLookup} disabled={!accountNumber.trim()}>
                    Verify
                  </Button>
                </div>
                {recipientName && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg px-3 py-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{recipientName}</span>
                    <CheckCircle2 className="h-4 w-4 ml-auto" />
                  </motion.div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                  step={1}
                />
                {numAmount > 0 && !hasEnough && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Insufficient balance
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Input
                  placeholder="What's this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={100}
                />
              </div>

              <Button
                className="w-full h-12 rounded-xl"
                disabled={!recipientName || numAmount < 1 || !hasEnough}
                onClick={handleProceed}
              >
                <Send className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <Card className="rounded-2xl border-2 border-primary/20">
                <CardContent className="p-6 space-y-4 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Send className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">Confirm Transfer</h2>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">To</span>
                      <span className="font-medium">{recipientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account</span>
                      <span className="font-mono text-xs">{accountNumber.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-lg font-bold text-primary">{convertPrice(numAmount)}</span>
                    </div>
                    {description && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Note</span>
                        <span className="text-right max-w-[200px] truncate">{description}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button className="w-full h-12 rounded-xl" onClick={handleSend} disabled={isSending}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send {convertPrice(numAmount)}
                </Button>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => setStep('form')}>
                  Go Back
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'sending' && (
            <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Sending...</h3>
              <p className="text-muted-foreground text-sm">Processing your transfer</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-primary">Money Sent!</h2>
              <p className="text-sm text-muted-foreground">
                {convertPrice(numAmount)} sent to {recipientName}
              </p>
              <div className="space-y-2 pt-4">
                <Button className="w-full rounded-xl" onClick={() => navigate('/pay')}>
                  Back to Wallet
                </Button>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => {
                  setStep('form');
                  setAccountNumber('');
                  setAmount('');
                  setDescription('');
                  setRecipientName(null);
                }}>
                  Send Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SendMoney;
