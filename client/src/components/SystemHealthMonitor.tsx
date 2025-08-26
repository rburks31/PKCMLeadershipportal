import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Server,
  Database,
  Mail,
  MessageSquare,
  Cpu,
  HardDrive,
  Network,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Activity,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemStatus {
  status: "healthy" | "warning" | "critical";
  uptime: number;
  lastChecked: string;
}

interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "degraded";
  responseTime: number;
  lastChecked: string;
  error?: string;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
}

interface PerformanceMetric {
  timestamp: string;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
}

export function SystemHealthMonitor() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: systemStatus, isLoading: systemLoading, refetch: refetchSystem } = useQuery({
    queryKey: ["/api/admin/system/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: services, isLoading: servicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ["/api/admin/system/services"],
    refetchInterval: 30000,
  });

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ["/api/admin/system/metrics"],
    refetchInterval: 30000,
  });

  const { data: performance } = useQuery({
    queryKey: ["/api/admin/system/performance"],
    refetchInterval: 60000, // Refresh every minute
  });

  const handleRefresh = async () => {
    setLastRefresh(new Date());
    await Promise.all([
      refetchSystem(),
      refetchServices(),
      refetchMetrics(),
    ]);
    
    toast({
      title: "System Status Updated",
      description: "All metrics have been refreshed",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
        return "text-green-600";
      case "warning":
      case "degraded":
        return "text-yellow-600";
      case "critical":
      case "offline":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "critical":
      case "offline":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Server className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="system-health-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <div className="flex items-center gap-2">
              {systemStatus && getStatusIcon((systemStatus as any)?.status)}
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemLoading ? "Loading..." : String((systemStatus as any)?.status?.toUpperCase() || "UNKNOWN")}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus && `Uptime: ${formatUptime((systemStatus as any)?.uptime || 0)}`}
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="system-health-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Monitor
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>Real-time system status and performance metrics</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={systemLoading || servicesLoading || metricsLoading}
                data-testid="button-refresh-health"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(systemLoading || servicesLoading || metricsLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-health-overview">Overview</TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-health-services">Services</TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-health-performance">Performance</TabsTrigger>
            <TabsTrigger value="metrics" data-testid="tab-health-metrics">Metrics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  {systemStatus && getStatusIcon((systemStatus as any)?.status)}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getStatusColor((systemStatus as any)?.status)}`}>
                    {(systemStatus as any)?.status?.toUpperCase() || "UNKNOWN"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uptime: {systemStatus ? formatUptime((systemStatus as any)?.uptime || 0) : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {services ? (services as ServiceStatus[]).filter(s => s.status === "online").length : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {services ? (services as ServiceStatus[]).length : 0} services online
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {services ? Math.round((services as ServiceStatus[]).reduce((acc, s) => acc + s.responseTime, 0) / (services as ServiceStatus[]).length) : 0}ms
                  </div>
                  <p className="text-xs text-muted-foreground">Average across services</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Health Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Cpu className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">CPU Usage</p>
                    <p className="text-2xl font-bold">{metrics ? Math.round((metrics as any).cpu) : 0}%</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Memory</p>
                    <p className="text-2xl font-bold">{metrics ? Math.round(((metrics as any).memory.used / (metrics as any).memory.total) * 100) : 0}%</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Storage</p>
                    <p className="text-2xl font-bold">{metrics ? Math.round((metrics as any).disk) : 0}%</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Network className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Active Users</p>
                    <p className="text-2xl font-bold">{performance ? (performance as any).activeConnections || 0 : 0}</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4">
              {services && (services as ServiceStatus[]).map((service, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {service.name === "Database" && <Database className="h-4 w-4" />}
                      {service.name === "Email Service" && <Mail className="h-4 w-4" />}
                      {service.name === "SMS Service" && <MessageSquare className="h-4 w-4" />}
                      {service.name === "API Server" && <Server className="h-4 w-4" />}
                      {service.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={service.status === "online" ? "default" : service.status === "degraded" ? "secondary" : "destructive"}
                        data-testid={`badge-service-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {service.status}
                      </Badge>
                      {getStatusIcon(service.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Response Time</p>
                        <p className="text-lg font-semibold">{service.responseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Checked</p>
                        <p className="text-sm">{new Date(service.lastChecked).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    {service.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">{service.error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>System performance over the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  {performance && (performance as PerformanceMetric[]).length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium">Avg Response Time</p>
                          <p className="text-2xl font-bold">
                            {Math.round((performance as PerformanceMetric[]).reduce((acc, p) => acc + p.responseTime, 0) / (performance as PerformanceMetric[]).length)}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Error Rate</p>
                          <p className="text-2xl font-bold">
                            {((performance as PerformanceMetric[]).reduce((acc, p) => acc + p.errorRate, 0) / (performance as PerformanceMetric[]).length).toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Peak Users</p>
                          <p className="text-2xl font-bold">
                            {Math.max(...(performance as PerformanceMetric[]).map(p => p.activeUsers))}
                          </p>
                        </div>
                      </div>
                      
                      <div className="h-40 bg-muted rounded flex items-center justify-center">
                        <p className="text-muted-foreground">Performance chart visualization would be here</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No performance data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4">
              {metrics && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        CPU & Memory
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>CPU Usage</span>
                          <span>{(metrics as SystemMetrics).cpu.usage}%</span>
                        </div>
                        <Progress value={(metrics as SystemMetrics).cpu.usage} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {(metrics as SystemMetrics).cpu.cores} cores available
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Memory Usage</span>
                          <span>{(metrics as SystemMetrics).memory.percentage}%</span>
                        </div>
                        <Progress value={(metrics as SystemMetrics).memory.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBytes((metrics as SystemMetrics).memory.used)} of {formatBytes((metrics as SystemMetrics).memory.total)} used
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Storage & Network
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Disk Usage</span>
                          <span>{(metrics as SystemMetrics).disk.percentage}%</span>
                        </div>
                        <Progress value={(metrics as SystemMetrics).disk.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBytes((metrics as SystemMetrics).disk.used)} of {formatBytes((metrics as SystemMetrics).disk.total)} used
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Network In</p>
                          <p className="text-lg font-semibold">{formatBytes((metrics as SystemMetrics).network.bytesIn)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Network Out</p>
                          <p className="text-lg font-semibold">{formatBytes((metrics as SystemMetrics).network.bytesOut)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}