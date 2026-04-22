import { supabase } from "@/integrations/supabase/client";

export interface SystemHealthMetrics {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    activeConnections: number;
    uptime: string;
  };
  api: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  storage: {
    status: 'healthy' | 'degraded' | 'down';
    usedSpace: number;
    totalSpace: number;
    uploadSpeed: number;
  };
  authentication: {
    status: 'healthy' | 'degraded' | 'down';
    activeUsers: number;
    failedLogins: number;
    successRate: number;
  };
}

export interface ErrorLog {
  timestamp: Date;
  type: string;
  message: string;
  count: number;
}

/**
 * Check database health and performance
 */
export const checkDatabaseHealth = async (): Promise<SystemHealthMetrics['database']> => {
  const startTime = Date.now();
  
  try {
    // Simple query to test database connection
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        status: 'down',
        responseTime,
        activeConnections: 0,
        uptime: '0h',
      };
    }
    
    return {
      status: responseTime < 100 ? 'healthy' : 'degraded',
      responseTime,
      activeConnections: 0, // Would need admin access to get this
      uptime: 'N/A', // Would need system metrics
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      activeConnections: 0,
      uptime: '0h',
    };
  }
};

/**
 * Check API health and performance
 */
export const checkAPIHealth = async (): Promise<SystemHealthMetrics['api']> => {
  const startTime = Date.now();
  
  try {
    // Test API with a simple query
    const { error } = await supabase.rpc('has_role', {
      _user_id: (await supabase.auth.getUser()).data.user?.id,
      _role: 'admin'
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime < 200 ? 'healthy' : 'degraded',
      responseTime,
      errorRate: error ? 100 : 0,
      requestsPerMinute: 0, // Would need monitoring service
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      errorRate: 100,
      requestsPerMinute: 0,
    };
  }
};

/**
 * Check storage health
 */
export const checkStorageHealth = async (): Promise<SystemHealthMetrics['storage']> => {
  try {
    // List buckets to verify storage access
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return {
        status: 'down',
        usedSpace: 0,
        totalSpace: 0,
        uploadSpeed: 0,
      };
    }
    
    return {
      status: 'healthy',
      usedSpace: 0, // Would need admin access
      totalSpace: 0, // Would need admin access
      uploadSpeed: 0, // Would need monitoring
    };
  } catch (error) {
    return {
      status: 'down',
      usedSpace: 0,
      totalSpace: 0,
      uploadSpeed: 0,
    };
  }
};

/**
 * Check authentication health
 */
export const checkAuthHealth = async (): Promise<SystemHealthMetrics['authentication']> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Get failed login attempts from last hour
    const { data: failedAttempts } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .gte('attempted_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
    
    const failedCount = failedAttempts?.length || 0;
    
    return {
      status: error ? 'down' : 'healthy',
      activeUsers: 0, // Would need admin access to auth.users
      failedLogins: failedCount,
      successRate: failedCount > 10 ? 80 : 99,
    };
  } catch (error) {
    return {
      status: 'down',
      activeUsers: 0,
      failedLogins: 0,
      successRate: 0,
    };
  }
};

/**
 * Get comprehensive system health metrics
 */
export const getSystemHealth = async (): Promise<SystemHealthMetrics> => {
  const [database, api, storage, authentication] = await Promise.all([
    checkDatabaseHealth(),
    checkAPIHealth(),
    checkStorageHealth(),
    checkAuthHealth(),
  ]);
  
  return {
    database,
    api,
    storage,
    authentication,
  };
};

/**
 * Get recent error logs (simulated for now)
 */
export const getRecentErrors = async (): Promise<ErrorLog[]> => {
  // In a production environment, this would query actual error logs
  // For now, returning empty array since we don't have error logging set up
  return [];
};
