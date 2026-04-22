-- Multi-currency wallet pockets
CREATE TABLE public.wallet_pockets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  currency TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);

ALTER TABLE public.wallet_pockets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own pockets" ON public.wallet_pockets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pockets" ON public.wallet_pockets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pockets" ON public.wallet_pockets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own pockets" ON public.wallet_pockets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_wallet_pockets_updated_at BEFORE UPDATE ON public.wallet_pockets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Savings vaults
CREATE TABLE public.vaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  icon TEXT DEFAULT 'piggy-bank',
  color TEXT DEFAULT '#3B82F6',
  round_up_enabled BOOLEAN NOT NULL DEFAULT false,
  target_date DATE,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own vaults" ON public.vaults FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own vaults" ON public.vaults FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own vaults" ON public.vaults FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own vaults" ON public.vaults FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_vaults_updated_at BEFORE UPDATE ON public.vaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vault transactions
CREATE TABLE public.vault_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'round_up', 'interest')),
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own vault txns" ON public.vault_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own vault txns" ON public.vault_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scheduled payments
CREATE TABLE public.scheduled_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_account_number TEXT,
  recipient_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  frequency TEXT NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'yearly')),
  next_run TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  description TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMPTZ,
  run_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scheduled" ON public.scheduled_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scheduled" ON public.scheduled_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own scheduled" ON public.scheduled_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own scheduled" ON public.scheduled_payments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_scheduled_payments_updated_at BEFORE UPDATE ON public.scheduled_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Split bills
CREATE TABLE public.split_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.split_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creator views own bills" ON public.split_bills FOR SELECT USING (auth.uid() = creator_user_id);
CREATE POLICY "Creator inserts bills" ON public.split_bills FOR INSERT WITH CHECK (auth.uid() = creator_user_id);
CREATE POLICY "Creator updates own bills" ON public.split_bills FOR UPDATE USING (auth.uid() = creator_user_id);
CREATE POLICY "Creator deletes own bills" ON public.split_bills FOR DELETE USING (auth.uid() = creator_user_id);

CREATE TRIGGER update_split_bills_updated_at BEFORE UPDATE ON public.split_bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Split bill participants
CREATE TABLE public.split_bill_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  split_bill_id UUID NOT NULL REFERENCES public.split_bills(id) ON DELETE CASCADE,
  participant_user_id UUID,
  participant_account_number TEXT,
  participant_name TEXT NOT NULL,
  amount_owed NUMERIC NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'declined')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.split_bill_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View if creator or participant" ON public.split_bill_participants FOR SELECT 
  USING (
    auth.uid() = participant_user_id OR 
    auth.uid() IN (SELECT creator_user_id FROM public.split_bills WHERE id = split_bill_id)
  );
CREATE POLICY "Creator inserts participants" ON public.split_bill_participants FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT creator_user_id FROM public.split_bills WHERE id = split_bill_id));
CREATE POLICY "Participant or creator updates" ON public.split_bill_participants FOR UPDATE 
  USING (
    auth.uid() = participant_user_id OR 
    auth.uid() IN (SELECT creator_user_id FROM public.split_bills WHERE id = split_bill_id)
  );

-- Virtual cards
CREATE TABLE public.virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_name TEXT NOT NULL DEFAULT 'Virtual Card',
  last4 TEXT NOT NULL,
  card_number_encrypted TEXT NOT NULL,
  cvv_encrypted TEXT NOT NULL,
  expiry_month INTEGER NOT NULL,
  expiry_year INTEGER NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'virtual' CHECK (card_type IN ('virtual', 'single_use', 'disposable')),
  spending_limit NUMERIC,
  spent_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own cards" ON public.virtual_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cards" ON public.virtual_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cards" ON public.virtual_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cards" ON public.virtual_cards FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_virtual_cards_updated_at BEFORE UPDATE ON public.virtual_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_wallet_pockets_user ON public.wallet_pockets(user_id);
CREATE INDEX idx_vaults_user ON public.vaults(user_id);
CREATE INDEX idx_vault_transactions_vault ON public.vault_transactions(vault_id);
CREATE INDEX idx_scheduled_payments_user_active ON public.scheduled_payments(user_id, is_active);
CREATE INDEX idx_split_bills_creator ON public.split_bills(creator_user_id);
CREATE INDEX idx_split_bill_participants_bill ON public.split_bill_participants(split_bill_id);
CREATE INDEX idx_virtual_cards_user ON public.virtual_cards(user_id);