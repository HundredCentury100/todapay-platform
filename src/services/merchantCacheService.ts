import { supabase } from "@/integrations/supabase/client";

/**
 * Consolidated caching service for merchant names
 * Reduces duplicate database calls
 */

let cachedOperatorNames: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get merchant operator names with caching to reduce database calls
 */
export async function getMerchantNames(): Promise<string[]> {
  const now = Date.now();
  
  if (cachedOperatorNames && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedOperatorNames;
  }

  const { data, error } = await supabase.rpc('get_merchant_operators', {
    _user_id: (await supabase.auth.getUser()).data.user?.id
  });

  if (error) throw error;
  
  cachedOperatorNames = (data || []).map((row: any) => row.operator_name);
  cacheTimestamp = now;
  
  return cachedOperatorNames;
}

/**
 * Clear the cache when needed (e.g., after merchant updates)
 */
export function clearMerchantNamesCache() {
  cachedOperatorNames = null;
  cacheTimestamp = 0;
}
