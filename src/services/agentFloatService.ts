import { supabase } from "@/integrations/supabase/client";

export interface FloatAccount {
  id: string;
  agent_profile_id: string;
  balance_usd: number;
  balance_zwg: number;
  total_loaded_usd: number;
  total_loaded_zwg: number;
  total_deducted_usd: number;
  total_deducted_zwg: number;
  low_balance_threshold_usd: number;
  low_balance_threshold_zwg: number;
  created_at: string;
  updated_at: string;
}

export interface FloatTransaction {
  id: string;
  float_account_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  balance_before: number;
  balance_after: number;
  description: string | null;
  bill_payment_id: string | null;
  loaded_by_admin_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export const getFloatAccount = async (agentProfileId: string): Promise<FloatAccount | null> => {
  const { data, error } = await supabase
    .from("agent_float_accounts")
    .select("*")
    .eq("agent_profile_id", agentProfileId)
    .maybeSingle();
  if (error) {
    console.error("Error fetching float account:", error);
    return null;
  }
  return data as FloatAccount | null;
};

export const getAllFloatAccounts = async (): Promise<(FloatAccount & { merchant_profiles?: any })[]> => {
  const { data, error } = await supabase
    .from("agent_float_accounts")
    .select("*, merchant_profiles!agent_profile_id(business_name, business_email, agent_code, role)")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("Error fetching all float accounts:", error);
    return [];
  }
  return (data || []) as any[];
};

export const getFloatTransactions = async (floatAccountId: string, limit = 50): Promise<FloatTransaction[]> => {
  const { data, error } = await supabase
    .from("agent_float_transactions")
    .select("*")
    .eq("float_account_id", floatAccountId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Error fetching float transactions:", error);
    return [];
  }
  return (data || []) as FloatTransaction[];
};

export const loadAgentFloat = async (
  agentProfileId: string,
  amount: number,
  currency: "USD" | "ZWG",
  adminId: string,
  description: string
) => {
  const { data, error } = await supabase.rpc("load_agent_float", {
    p_agent_profile_id: agentProfileId,
    p_amount: amount,
    p_currency: currency,
    p_admin_id: adminId,
    p_description: description,
  });
  if (error) throw error;
  return data;
};

export const deductAgentFloat = async (
  agentProfileId: string,
  amount: number,
  currency: "USD" | "ZWG",
  billPaymentId?: string,
  description?: string
) => {
  const { data, error } = await supabase.rpc("deduct_agent_float", {
    p_agent_profile_id: agentProfileId,
    p_amount: amount,
    p_currency: currency,
    p_bill_payment_id: billPaymentId || null,
    p_description: description || "Bill payment deduction",
  });
  if (error) throw error;
  return data;
};
