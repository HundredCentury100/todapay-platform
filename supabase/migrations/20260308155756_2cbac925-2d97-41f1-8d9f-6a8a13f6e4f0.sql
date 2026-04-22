
-- Registered external AI agents for A2A
CREATE TABLE IF NOT EXISTS public.registered_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  agent_url text NOT NULL,
  api_key_hash text NOT NULL,
  commission_rate numeric DEFAULT 3,
  capabilities text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  registered_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Commerce agent session tables
CREATE TABLE IF NOT EXISTS public.commerce_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  external_agent_id uuid REFERENCES public.registered_agents(id) ON DELETE SET NULL,
  session_type text NOT NULL DEFAULT 'user_chat',
  context jsonb DEFAULT '{}',
  held_items jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '30 minutes'
);

CREATE TABLE IF NOT EXISTS public.commerce_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.commerce_sessions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  content text,
  tool_calls jsonb,
  tool_results jsonb,
  message_type text DEFAULT 'text',
  rich_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- A2A transaction log
CREATE TABLE IF NOT EXISTS public.a2a_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.registered_agents(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.commerce_sessions(id) ON DELETE SET NULL,
  transaction_type text NOT NULL,
  vertical text,
  item_id text,
  amount numeric,
  commission_chain jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'initiated',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.commerce_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a2a_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON public.commerce_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own session messages" ON public.commerce_messages
  FOR ALL TO authenticated
  USING (session_id IN (SELECT id FROM public.commerce_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM public.commerce_sessions WHERE user_id = auth.uid()));

CREATE POLICY "View active agents" ON public.registered_agents
  FOR SELECT TO authenticated USING (status = 'active');

CREATE POLICY "Admins manage agents" ON public.registered_agents
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own a2a transactions" ON public.a2a_transactions
  FOR SELECT TO authenticated
  USING (session_id IN (SELECT id FROM public.commerce_sessions WHERE user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.commerce_messages;
