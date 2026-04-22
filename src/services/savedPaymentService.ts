import { supabase } from "@/integrations/supabase/client";

export interface SavedPaymentMethod {
  id: string;
  user_id: string;
  payment_type: string;
  provider: string | null;
  masked_reference: string | null;
  display_name: string | null;
  is_default: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const savedPaymentService = {
  async getSavedMethods(): Promise<SavedPaymentMethod[]> {
    const { data, error } = await supabase
      .from('user_saved_payment_methods')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SavedPaymentMethod[];
  },

  async saveMethod(
    paymentType: string,
    provider: string | null,
    maskedReference: string | null,
    displayName: string | null,
    metadata: Record<string, any> = {}
  ): Promise<SavedPaymentMethod> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('user_saved_payment_methods')
      .insert({
        user_id: user.id,
        payment_type: paymentType,
        provider,
        masked_reference: maskedReference,
        display_name: displayName,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SavedPaymentMethod;
  },

  async setDefaultMethod(methodId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // First, unset all defaults
    await supabase
      .from('user_saved_payment_methods')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Then set the new default
    const { error } = await supabase
      .from('user_saved_payment_methods')
      .update({ is_default: true })
      .eq('id', methodId);

    if (error) throw error;
  },

  async deleteMethod(methodId: string): Promise<void> {
    const { error } = await supabase
      .from('user_saved_payment_methods')
      .delete()
      .eq('id', methodId);

    if (error) throw error;
  },

  async getDefaultMethod(): Promise<SavedPaymentMethod | null> {
    const { data, error } = await supabase
      .from('user_saved_payment_methods')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as SavedPaymentMethod | null;
  },

  getMaskedDisplay(paymentType: string, reference: string | null): string {
    if (!reference) return paymentType;
    
    switch (paymentType) {
      case 'mobile_money':
        return `****${reference.slice(-4)}`;
      case 'bank_transfer':
        return `****${reference.slice(-4)}`;
      case 'payment_gateway':
        return `Card ****${reference.slice(-4)}`;
      default:
        return paymentType;
    }
  }
};
