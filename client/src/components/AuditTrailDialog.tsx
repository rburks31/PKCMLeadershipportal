import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Shield,
  User,
  Settings,
  BookOpen,
  MessageCircle,
  Mail,
  Calendar,
  Download,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "success" | "failed" | "pending";
}

interface AuditTrailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditTrailDialog({ open, onOpenChange }: AuditTrailDialogProps) {
  const [filters, setFilters] = useState({
    action: "",
    resource: "",
    severity: "",
    status: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["/api/admin/audit-logs", filters, currentPage, pageSize],
    enabled: open,
  });

  const { data: auditStats } = useQuery({
    queryKey: ["/api/admin/audit-stats"],
    enabled: open,
  });

  const getActionIcon = (action: string) => {
    if (action.includes("create") || action.includes("add")) return <Plus className="h-4 w-4" />;
    if (action.includes("update") || action.includes("edit")) return <Edit className="h-4 w-4" />;
    if (action.includes("delete") || action.includes("remove")) return <Trash2 className="h-4 w-4" />;
    if (action.includes("view") || action.includes("read")) return <Eye className="h-4 w-4" />;
    if (action.includes("login") || action.includes("auth")) return <User className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  const getResourceIcon = (resource: string) => {
    switch (resource.toLowerCase()) {
      case "user": return <User className="h-4 w-4" />;
      case "course": return <BookOpen className="h-4 w-4" />;
      case "discussion": return <MessageCircle className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "class": return <Calendar className="h-4 w-4" />;
      case "system": return <Settings className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-blue-100 text-blue-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      action: "",
      resource: "",
      severity: "",
      status: "",
      userId: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    });
    setCurrentPage(1);
  };

  const exportAuditLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit-logs/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filters, format: "csv" }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const totalPages = auditLogs ? Math.ceil((auditLogs as any).total / pageSize) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto" data-testid="audit-trail-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Trail
          </DialogTitle>
          <DialogDescription>
            Track all administrative actions and system events for security and compliance
          </DialogDescription>
        </DialogHeader>

        {/* Statistics Cards */}
        {auditStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Actions</p>
                    <p className="text-2xl font-bold">{(auditStats as any).totalActions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Active Users</p>
                    <p className="text-2xl font-bold">{(auditStats as any).activeUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Success Rate</p>
                    <p className="text-2xl font-bold">{(auditStats as any).successRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Critical Events</p>
                    <p className="text-2xl font-bold">{(auditStats as any).criticalEvents || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-8"
                    data-testid="input-audit-search"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="action">Action</Label>
                <Select value={filters.action} onValueChange={(value) => handleFilterChange("action", value)}>
                  <SelectTrigger data-testid="select-audit-action">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="resource">Resource</Label>
                <Select value={filters.resource} onValueChange={(value) => handleFilterChange("resource", value)}>
                  <SelectTrigger data-testid="select-audit-resource">
                    <SelectValue placeholder="All resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All resources</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="discussion">Discussion</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={filters.severity} onValueChange={(value) => handleFilterChange("severity", value)}>
                  <SelectTrigger data-testid="select-audit-severity">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                Clear Filters
              </Button>
              <Button variant="outline" onClick={exportAuditLogs} data-testid="button-export-audit">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              Detailed log of all administrative actions and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading audit logs...</p>
              </div>
            ) : auditLogs && (auditLogs as any).logs?.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(auditLogs as any).logs.map((log: AuditLog) => (
                      <TableRow key={log.id} data-testid={`audit-row-${log.id}`}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <p className="font-medium">{log.userEmail}</p>
                              <p className="text-xs text-muted-foreground">{log.userId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="font-medium">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getResourceIcon(log.resource)}
                            <div>
                              <p className="font-medium">{log.resource}</p>
                              {log.resourceId && (
                                <p className="text-xs text-muted-foreground">ID: {log.resourceId}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="capitalize">{log.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        {totalPages > 5 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No audit logs found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}