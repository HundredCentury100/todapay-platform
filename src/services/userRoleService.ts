import { supabase } from "@/integrations/supabase/client";

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

/**
 * Fetch all users with their roles
 */
export const getAllUsersWithRoles = async (): Promise<UserWithRoles[]> => {
  // First get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .order('created_at', { ascending: false });

  if (profilesError) throw profilesError;

  // Then get all user roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (rolesError) throw rolesError;

  // Combine the data
  const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
    const roles = userRoles
      .filter(ur => ur.user_id === profile.id)
      .map(ur => ur.role);

    return {
      ...profile,
      roles: roles.length > 0 ? roles : ['user']
    };
  });

  return usersWithRoles;
};

/**
 * Grant admin role to a user
 */
export const grantAdminRole = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: 'admin'
    });

  if (error) {
    // Handle duplicate error gracefully
    if (error.code === '23505') {
      throw new Error('User already has admin role');
    }
    throw error;
  }

  // Log the activity (import at top of file)
  const { logAdminActivity } = await import('./adminAnalyticsService');
  await logAdminActivity(
    'user_role_grant',
    `Admin role granted to user`,
    userId,
    'user_roles',
    userId,
    { role: 'admin' }
  );
};

/**
 * Revoke admin role from a user
 */
export const revokeAdminRole = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', 'admin');

  if (error) throw error;

  // Log the activity
  const { logAdminActivity } = await import('./adminAnalyticsService');
  await logAdminActivity(
    'user_role_revoke',
    `Admin role revoked from user`,
    userId,
    'user_roles',
    userId,
    { role: 'admin' }
  );
};

/**
 * Check if user has admin role
 */
export const getUserRoles = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) throw error;
  
  return data.map(r => r.role);
};
