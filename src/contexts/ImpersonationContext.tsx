import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MerchantProfile } from "@/types/merchant";
import { toast } from "sonner";

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedMerchant: MerchantProfile | null;
  startImpersonation: (merchant: MerchantProfile, reason: string) => Promise<void>;
  endImpersonation: () => Promise<void>;
  logAction: (action: string, details?: any) => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const ImpersonationProvider = ({ children }: { children: ReactNode }) => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedMerchant, setImpersonatedMerchant] = useState<MerchantProfile | null>(null);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    // Check if there's an active impersonation session
    const savedSession = localStorage.getItem('impersonation_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setIsImpersonating(true);
      setImpersonatedMerchant(session.merchant);
      setCurrentLogId(session.logId);
    }
  }, []);

  const startImpersonation = async (merchant: MerchantProfile, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: log, error } = await supabase
        .from('admin_impersonation_logs')
        .insert([{
          admin_user_id: user.id,
          merchant_profile_id: merchant.id,
          reason
        }])
        .select()
        .single();

      if (error) throw error;

      setIsImpersonating(true);
      setImpersonatedMerchant(merchant);
      setCurrentLogId(log.id);
      setActions([]);

      // Save to localStorage for persistence
      localStorage.setItem('impersonation_session', JSON.stringify({
        merchant,
        logId: log.id
      }));

      toast.success(`Now impersonating ${merchant.business_name}`);
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast.error('Failed to start impersonation');
      throw error;
    }
  };

  const endImpersonation = async () => {
    if (!currentLogId) return;

    try {
      const { error } = await supabase
        .from('admin_impersonation_logs')
        .update({
          ended_at: new Date().toISOString(),
          actions_performed: actions
        })
        .eq('id', currentLogId);

      if (error) throw error;

      setIsImpersonating(false);
      setImpersonatedMerchant(null);
      setCurrentLogId(null);
      setActions([]);
      localStorage.removeItem('impersonation_session');

      toast.info('Impersonation session ended');
    } catch (error) {
      console.error('Error ending impersonation:', error);
      toast.error('Failed to end impersonation');
    }
  };

  const logAction = (action: string, details?: any) => {
    const newAction = {
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setActions(prev => [...prev, newAction]);
  };

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonatedMerchant,
        startImpersonation,
        endImpersonation,
        logAction
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within ImpersonationProvider');
  }
  return context;
};
