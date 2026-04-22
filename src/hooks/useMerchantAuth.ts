import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getMerchantProfile } from "@/services/merchantService";
import { MerchantProfile, MerchantRole } from "@/types/merchant";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";

// Retry helper function
const retryOperation = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Max retries exceeded');
};

export const useMerchantAuth = (requiredRole?: MerchantRole) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdminUser, loading: adminLoading } = useAdmin();
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkMerchantAccess = async () => {
      if (authLoading || adminLoading) return;
      
      // Skip merchant check for admin routes if user is admin
      const isAdminRoute = location.pathname.startsWith('/merchant/admin');
      if (isAdminRoute && isAdminUser) {
        setHasAccess(true);
        setLoading(false);
        return;
      }
      
      if (!user) {
        navigate('/merchant/auth');
        return;
      }

      try {
        console.log('[MerchantAuth] Fetching merchant profile...');
        
        const profile = await retryOperation(
          () => getMerchantProfile(requiredRole),
          3,
          1000
        );
        
        if (!profile) {
          console.log('[MerchantAuth] No profile found, redirecting to portal');
          navigate('/merchant/portal');
          return;
        }

        console.log('[MerchantAuth] Profile found:', { 
          role: profile.role, 
          status: profile.verification_status,
          isAdmin: isAdminUser 
        });

        setMerchantProfile(profile);

        // Admins always have access
        if (isAdminUser) {
          console.log('[MerchantAuth] Admin user detected, granting access');
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // For regular merchants, allow pending and verified users to access portal
        if (profile.verification_status === 'verified' || profile.verification_status === 'pending') {
          console.log('[MerchantAuth] Merchant has access (verified or pending)');
          setHasAccess(true);
        } else {
          console.log('[MerchantAuth] Rejected or invalid status, redirecting to portal');
          navigate('/merchant/portal');
        }
      } catch (error) {
        console.error('[MerchantAuth] Error checking merchant access:', error);
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('not authenticated') || errorMessage.includes('no rows')) {
          navigate('/merchant/portal');
        }
      } finally {
        setLoading(false);
      }
    };

    checkMerchantAccess();

    // Subscribe to realtime updates for merchant profile (skip for admin routes)
    if (user && !location.pathname.startsWith('/merchant/admin')) {
      const channel = supabase
        .channel('merchant-profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'merchant_profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const updatedProfile = payload.new as MerchantProfile;
            setMerchantProfile(updatedProfile);
            
            // Update access status - allow both verified and pending
            if (updatedProfile.verification_status === 'verified' || updatedProfile.verification_status === 'pending') {
              setHasAccess(true);
            } else {
              setHasAccess(false);
              navigate('/merchant/portal');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, authLoading, adminLoading, isAdminUser, requiredRole, navigate, location.pathname]);

  return { merchantProfile, loading, hasAccess };
};
