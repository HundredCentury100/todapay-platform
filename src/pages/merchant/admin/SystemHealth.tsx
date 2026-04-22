import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { 
  Activity, 
  Database, 
  Zap, 
  HardDrive, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  RefreshCw
} from "lucide-react";
import { getSystemHealth, SystemHealthMetrics } from "@/services/systemHealthService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const SystemHealth = () => {
  const { isAdminUser, loading: adminLoading } = useAdmin();
  const [metrics, setMetrics] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadMetrics();
    
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadMetrics();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await getSystemHealth();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error loading system health:', error);
      toast.error('Failed to load system health metrics');
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdminUser) {
    return <Navigate to="/merchant/admin/auth" replace />;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      case 'down':
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const overallHealth = 
    metrics.database.status === 'healthy' &&
    metrics.api.status === 'healthy' &&
    metrics.storage.status === 'healthy' &&
    metrics.authentication.status === 'healthy'
      ? 'healthy'
      : metrics.database.status === 'down' || metrics.api.status === 'down'
      ? 'down'
      : 'degraded';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Monitor</h1>
          <p className="text-muted-foreground">
            Real-time system performance and health metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button onClick={loadMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(overallHealth)}
              <div>
                <CardTitle>Overall System Status</CardTitle>
                <CardDescription>Current health of all services</CardDescription>
              </div>
            </div>
            {getStatusBadge(overallHealth)}
          </div>
        </CardHeader>
      </Card>

      {/* Service Health Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Database Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Database</CardTitle>
              </div>
              {getStatusBadge(metrics.database.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response Time</span>
                <span className="font-medium">{metrics.database.responseTime}ms</span>
              </div>
              <Progress 
                value={Math.min((metrics.database.responseTime / 200) * 100, 100)} 
                className="h-2"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Connections</span>
              <span className="font-medium">{metrics.database.activeConnections}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">{metrics.database.uptime}</span>
            </div>
          </CardContent>
        </Card>

        {/* API Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">API</CardTitle>
              </div>
              {getStatusBadge(metrics.api.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response Time</span>
                <span className="font-medium">{metrics.api.responseTime}ms</span>
              </div>
              <Progress 
                value={Math.min((metrics.api.responseTime / 300) * 100, 100)} 
                className="h-2"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Error Rate</span>
              <span className={`font-medium ${metrics.api.errorRate > 5 ? 'text-red-500' : ''}`}>
                {metrics.api.errorRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Requests/min</span>
              <span className="font-medium">{metrics.api.requestsPerMinute}</span>
            </div>
          </CardContent>
        </Card>

        {/* Storage Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Storage</CardTitle>
              </div>
              {getStatusBadge(metrics.storage.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Used Space</span>
                <span className="font-medium">
                  {metrics.storage.usedSpace} / {metrics.storage.totalSpace} GB
                </span>
              </div>
              <Progress 
                value={metrics.storage.totalSpace > 0 
                  ? (metrics.storage.usedSpace / metrics.storage.totalSpace) * 100 
                  : 0
                } 
                className="h-2"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Upload Speed</span>
              <span className="font-medium">{metrics.storage.uploadSpeed} MB/s</span>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Authentication</CardTitle>
              </div>
              {getStatusBadge(metrics.authentication.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Users</span>
              <span className="font-medium">{metrics.authentication.activeUsers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Failed Logins (1h)</span>
              <span className={`font-medium ${metrics.authentication.failedLogins > 10 ? 'text-red-500' : ''}`}>
                {metrics.authentication.failedLogins}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium">{metrics.authentication.successRate}%</span>
              </div>
              <Progress value={metrics.authentication.successRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Average response times across services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Queries</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${metrics.database.responseTime < 100 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {metrics.database.responseTime}ms
                </span>
                {metrics.database.responseTime < 100 ? (
                  <Badge variant="outline" className="text-green-500 border-green-500">Optimal</Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500">Slow</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Responses</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${metrics.api.responseTime < 200 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {metrics.api.responseTime}ms
                </span>
                {metrics.api.responseTime < 200 ? (
                  <Badge variant="outline" className="text-green-500 border-green-500">Optimal</Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500">Slow</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealth;
