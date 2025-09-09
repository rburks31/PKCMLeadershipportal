import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  BookOpen, 
  MessageCircle, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus,
  GraduationCap,
  Activity,
  BarChart3,
  TrendingUp,
  Bell,
  Video,
  ArrowLeft,
  ArrowRight,
  Search,
  Shield,
  Database,
  Server
} from "lucide-react";
import Layout from "@/components/Layout";
import logoImage from "@assets/SEVEN WEAPONS OF THE WEAPON_1755651386501.jpg";
import { Link } from "wouter";
import { AdminTooltip } from "@/components/AdminTooltip";
import { AdminOnboardingTour, OnboardingStarter } from "@/components/AdminOnboardingTour";
import { AdminQuickActions } from "@/components/AdminQuickActions";
import { AdminActivityFeed } from "@/components/AdminActivityFeed";
import { ScheduleLiveClassDialog } from "@/components/ScheduleLiveClassDialog";
import { AnnouncementDialog } from "@/components/AnnouncementDialog";
import { ReportsDialog } from "@/components/ReportsDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { VideoIntegrationDialog } from "@/components/VideoIntegrationDialog";
import { BulkOperationsDialog } from "@/components/BulkOperationsDialog";
import { SystemHealthMonitor } from "@/components/SystemHealthMonitor";
import { AuditTrailDialog } from "@/components/AuditTrailDialog";
import { AdvancedSearchDialog } from "@/components/AdvancedSearchDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// User creation form schema
const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["student", "instructor", "admin"], {
    required_error: "Please select a role",
  }),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  modules: Module[];
}

interface Module {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  isPublished: boolean;
  orderIndex: number;
}

interface Discussion {
  id: number;
  content: string;
  createdAt: string;
  user: User;
  lesson: {
    title: string;
  };
}

export default function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showScheduleClassDialog, setShowScheduleClassDialog] = useState(false);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showVideoIntegrationDialog, setShowVideoIntegrationDialog] = useState(false);
  const [showBulkOperationsDialog, setShowBulkOperationsDialog] = useState(false);
  const [showAuditTrailDialog, setShowAuditTrailDialog] = useState(false);
  const [showAdvancedSearchDialog, setShowAdvancedSearchDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true); // Temporarily true for testing

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || (user as any)?.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "You need administrator privileges to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }, [user, authLoading, toast]);

  // Queries
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user && (user as any)?.role === 'admin',
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/admin/courses"],
    enabled: !!user && (user as any)?.role === 'admin',
  });

  const { data: discussions, isLoading: discussionsLoading } = useQuery({
    queryKey: ["/api/admin/discussions"],
    enabled: !!user && (user as any)?.role === 'admin',
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: !!user && (user as any)?.role === 'admin',
  });

  // Check for first time user and onboarding
  const { data: onboardingData } = useQuery({
    queryKey: ["/api/admin/onboarding"],
    enabled: !!user && (user as any)?.role === 'admin',
  });

  useEffect(() => {
    // Check if user has completed the tour
    if (onboardingData && Array.isArray(onboardingData)) {
      const completedTour = onboardingData.some((step: any) => 
        step.step === 'tour_completed' && step.completed
      );
      setIsFirstTimeUser(!completedTour);
    } else if (onboardingData && Array.isArray(onboardingData) && onboardingData.length === 0) {
      // If no onboarding data exists, show tour for first time user
      setIsFirstTimeUser(true);
    }
  }, [onboardingData]);

  // Quick action handlers
  const handleCreateCourse = () => {
    // Trigger the hidden CreateCourseDialog
    const createCourseButton = document.querySelector('[data-testid="button-create-course"]') as HTMLElement;
    if (createCourseButton) {
      createCourseButton.click();
    }
  };

  const handleAddUser = () => {
    setShowCreateUserDialog(true);
  };

  const handleScheduleClass = () => {
    setShowScheduleClassDialog(true);
  };

  const handleSendAnnouncement = () => {
    setShowAnnouncementDialog(true);
  };

  const handleViewReports = () => {
    setShowReportsDialog(true);
  };

  const handleManageSettings = () => {
    setShowSettingsDialog(true);
  };

  // User creation form
  const createUserForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "student",
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      await apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User created successfully" });
      setShowCreateUserDialog(false);
      createUserForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create user", 
        variant: "destructive" 
      });
    },
  });

  const handleCreateUser = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User removed successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to remove user", 
        variant: "destructive" 
      });
    },
  });

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Mutations
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User role updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      await apiRequest("POST", "/api/admin/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Success", description: "Course created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create course", variant: "destructive" });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("DELETE", `/api/admin/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Success", description: "Course deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete course", variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: number; isPublished: boolean }) => {
      await apiRequest("PATCH", `/api/admin/courses/${id}/publish`, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Success", description: "Course status updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update course status", variant: "destructive" });
    },
  });

  const respondToDiscussionMutation = useMutation({
    mutationFn: async ({ discussionId, content }: { discussionId: number; content: string }) => {
      await apiRequest("POST", `/api/admin/discussions/${discussionId}/respond`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discussions"] });
      toast({ title: "Success", description: "Response posted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post response", variant: "destructive" });
    },
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || (user as any)?.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8" data-testid="admin-dashboard-overview">
          {/* Onboarding Tour */}
          <AdminOnboardingTour 
            isOpen={showOnboardingTour} 
            onClose={() => setShowOnboardingTour(false)} 
          />
          
          <div className="flex items-center justify-center mb-6">
            <img 
              src={logoImage} 
              alt="PKCM Logo" 
              className="h-12 w-auto mr-4 pkcm-logo"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-admin-title">
                Administration Portal
              </h1>
            </div>
          </div>
          <p className="text-pastoral-gray text-center">
            Manage courses, users, and monitor student activity for PKCM Leadership and Ministry Class
          </p>
          
          {/* Onboarding Starter for first-time users */}
          {isFirstTimeUser && (
            <div className="mt-6">
              <OnboardingStarter onStart={() => {
                console.log("Starting onboarding tour...");
                setShowOnboardingTour(true);
              }} />

            </div>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses" data-testid="admin-nav-courses">
              <BookOpen className="w-4 h-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="admin-nav-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="discussions" data-testid="admin-nav-discussions">
              <MessageCircle className="w-4 h-4 mr-2" />
              Discussions
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions Section with enhanced admin features */}
            <div className="mb-8" data-testid="admin-quick-actions">
              <AdminQuickActions
                onCreateCourse={handleCreateCourse}
                onAddUser={handleAddUser}
                onScheduleClass={handleScheduleClass}
                onSendAnnouncement={handleSendAnnouncement}
                onViewReports={handleViewReports}
                onManageSettings={handleManageSettings}
              />
              
              {/* Hidden CreateCourseDialog for Quick Actions */}
              <div style={{ display: 'none' }}>
                <CreateCourseDialog onCreateCourse={createCourseMutation.mutate} />
              </div>
            </div>

            {/* Admin Management Quick Access */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="text-blue-600" />
                    User Management
                  </CardTitle>
                  <CardDescription>Add, edit, and manage students and instructors</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/users" className="w-full">
                    <Button className="w-full" variant="outline" data-testid="link-user-management">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="text-blue-600" />
                    Communication Center
                  </CardTitle>
                  <CardDescription>Send SMS/MMS messages to students and instructors</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/sms" className="w-full">
                    <Button className="w-full" variant="outline" data-testid="link-sms-management">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      SMS Management Portal
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <AdminTooltip 
                title="Total Users" 
                description="Track the total number of registered users including students, instructors, and administrators"
                feature="total-users"
              >
                <Card data-testid="card-total-users">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics as any)?.total_users || 0}</div>
                    <p className="text-xs text-muted-foreground">Active platform users</p>
                  </CardContent>
                </Card>
              </AdminTooltip>
              
              <AdminTooltip 
                title="Total Courses"
                description="Monitor all courses on the platform including published and draft courses"
                feature="total-courses"
              >
                <Card data-testid="card-total-courses">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics as any)?.total_courses || 0}</div>
                    <p className="text-xs text-muted-foreground">Published and draft</p>
                  </CardContent>
                </Card>
              </AdminTooltip>

              <AdminTooltip 
                title="Active Discussions"
                description="View recent discussion activity and student engagement"
                feature="active-discussions"
              >
                <Card data-testid="card-active-discussions">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Discussions</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics as any)?.active_discussions || 0}</div>
                    <p className="text-xs text-muted-foreground">Recent conversations</p>
                  </CardContent>
                </Card>
              </AdminTooltip>

              <AdminTooltip 
                title="Completion Rate"
                description="Monitor overall course completion rates and student progress"
                feature="completion-rate"
              >
                <Card data-testid="card-completion-rate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round((analytics as any)?.completion_rate) || 0}%</div>
                    <p className="text-xs text-muted-foreground">Average course progress</p>
                  </CardContent>
                </Card>
              </AdminTooltip>

            </div>

            {/* Advanced Admin Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowAdvancedSearchDialog(true)} data-testid="card-advanced-search">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Advanced Search</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Search across all platform content</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowBulkOperationsDialog(true)} data-testid="card-bulk-operations">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bulk Operations</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Mass email, SMS, import/export</p>
                </CardContent>
              </Card>

              <SystemHealthMonitor />

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowAuditTrailDialog(true)} data-testid="card-audit-trail">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Audit Trail</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Track admin actions & security</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity with AdminActivityFeed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="admin-activity-feed">
              <Card>
                <CardHeader>
                  <CardTitle>Student Progress Overview</CardTitle>
                  <CardDescription>Recent enrollment and completion activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Enrollments</span>
                      <Badge variant="outline">{(analytics as any)?.total_enrollments || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Progress</span>
                      <Badge variant="default">{Math.round((analytics as any)?.completion_rate) || 0}%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Activity Feed Component */}
              <AdminActivityFeed />
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Course Management</h2>
              <CreateCourseDialog onCreateCourse={createCourseMutation.mutate} />
            </div>
            
            <div className="grid gap-4">
              {coursesLoading ? (
                <div>Loading courses...</div>
              ) : (courses as any)?.map?.((course: any) => (
                <Card key={course.id} data-testid={`card-course-${course.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={course.is_published ? "default" : "secondary"}>
                          {course.is_published ? "Published" : "Draft"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublishMutation.mutate({ id: course.id, isPublished: !course.is_published })}
                          data-testid={`button-toggle-publish-${course.id}`}
                        >
                          {course.is_published ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/courses/${course.id}`, '_blank')}
                          data-testid={`button-preview-course-${course.id}`}
                        >
                          Preview as Student
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCourseMutation.mutate(course.id)}
                          data-testid={`button-delete-course-${course.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {course.modules?.length || 0} modules • Created {new Date(course.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">User Management</h2>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center">Loading users...</td>
                        </tr>
                      ) : (users as any)?.map?.((user: any) => (
                        <tr key={user.id} data-testid={`row-user-${user.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName || user.first_name} {user.lastName || user.last_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'instructor' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 
                             user.created_at ? new Date(user.created_at).toLocaleDateString() : 
                             'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2 items-center">
                              <UserRoleDialog 
                                user={user} 
                                onUpdateRole={(role) => updateUserRoleMutation.mutate({ userId: user.id, role })} 
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id, `${user.firstName || user.first_name} ${user.lastName || user.last_name}`)}
                                disabled={deleteUserMutation.isPending}
                                className="text-red-600 hover:text-red-900 p-1"
                                data-testid={`button-delete-user-${user.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discussions Tab */}
          <TabsContent value="discussions" className="space-y-6">
            <h2 className="text-xl font-semibold">Discussion Management</h2>
            
            <div className="grid gap-4">
              {discussionsLoading ? (
                <div>Loading discussions...</div>
              ) : (discussions as any)?.map?.((discussion: any) => (
                <Card key={discussion.id} data-testid={`card-discussion-${discussion.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {discussion.first_name} {discussion.last_name}
                        </CardTitle>
                        <CardDescription>
                          in {discussion.lesson_title} • {new Date(discussion.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{discussion.content}</p>
                    <RespondToDiscussionDialog 
                      discussionId={discussion.id}
                      onRespond={(content) => respondToDiscussionMutation.mutate({ discussionId: discussion.id, content })}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-xl font-semibold">Platform Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" value="PKCM Leadership and Ministry Class" readOnly />
                </div>
                <div>
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" value={(user as any)?.email || ''} readOnly />
                </div>
              </CardContent>
            </Card>

            {/* Communication Testing */}
            <Card>
              <CardHeader>
                <CardTitle>Communication Testing</CardTitle>
                <CardDescription>Test email and SMS functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TestEmailSection />
                <TestSMSSection />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create User Dialog */}
        <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription className="space-y-2">
                <span>Add a new user to the platform. They will receive a welcome email with instructions.</span>
                <span className="text-amber-600 font-medium block mt-2">
                  ⚠️ Important: Users must have a Replit account to log in. They cannot use email/password.
                </span>
                <span className="text-sm block">
                  To sign in, users will need to:
                  1. Click "Sign In with Replit" on the landing page
                  2. Log in with their Replit account credentials
                  3. The system will automatically match them to this profile
                </span>
              </DialogDescription>
            </DialogHeader>
            <Form {...createUserForm}>
              <form onSubmit={createUserForm.handleSubmit(handleCreateUser)} className="space-y-4">
                <FormField
                  control={createUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder="user@example.com"
                          data-testid="input-user-email"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        For welcome email only. Login requires a Replit account.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createUserForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="John"
                          data-testid="input-user-firstname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createUserForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Doe"
                          data-testid="input-user-lastname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-user-role">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateUserDialog(false)}
                    data-testid="button-cancel-user"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createUserMutation.isPending}
                    data-testid="button-create-user"
                  >
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Schedule Live Class Dialog */}
        <ScheduleLiveClassDialog
          open={showScheduleClassDialog}
          onOpenChange={setShowScheduleClassDialog}
        />

        {/* Announcement Dialog */}
        <AnnouncementDialog
          open={showAnnouncementDialog}
          onOpenChange={setShowAnnouncementDialog}
        />

        {/* Reports Dialog */}
        <ReportsDialog
          open={showReportsDialog}
          onOpenChange={setShowReportsDialog}
        />

        {/* Settings Dialog */}
        <SettingsDialog
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
        />

        {/* Video Integration Dialog */}
        <VideoIntegrationDialog 
          open={showVideoIntegrationDialog} 
          onOpenChange={setShowVideoIntegrationDialog} 
        />

        {/* Bulk Operations Dialog */}
        <BulkOperationsDialog 
          open={showBulkOperationsDialog} 
          onOpenChange={setShowBulkOperationsDialog} 
          selectedUsers={selectedUsers}
        />

        {/* Audit Trail Dialog */}
        <AuditTrailDialog 
          open={showAuditTrailDialog} 
          onOpenChange={setShowAuditTrailDialog} 
        />

        {/* Advanced Search Dialog */}
        <AdvancedSearchDialog 
          open={showAdvancedSearchDialog} 
          onOpenChange={setShowAdvancedSearchDialog} 
        />
      </div>
    </Layout>
  );
}

// Dialog Components
function CreateCourseDialog({ onCreateCourse }: { onCreateCourse: (data: any) => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    modules: [] as Array<{
      title: string;
      description: string;
      order: number;
      lessons: Array<{
        title: string;
        content: string;
        video_url?: string;
        order: number;
      }>;
    }>
  });

  const addModule = () => {
    setCourseData(prev => ({
      ...prev,
      modules: [...prev.modules, {
        title: "",
        description: "",
        order: prev.modules.length + 1,
        lessons: []
      }]
    }));
  };

  const updateModule = (index: number, field: string, value: string) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => 
        i === index ? { ...module, [field]: value } : module
      )
    }));
  };

  const removeModule = (index: number) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index)
    }));
  };

  const addLesson = (moduleIndex: number) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => 
        i === moduleIndex 
          ? {
              ...module, 
              lessons: [...module.lessons, {
                title: "",
                content: "",
                video_url: "",
                order: module.lessons.length + 1
              }]
            }
          : module
      )
    }));
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: string) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => 
        i === moduleIndex 
          ? {
              ...module,
              lessons: module.lessons.map((lesson, j) =>
                j === lessonIndex ? { ...lesson, [field]: value } : lesson
              )
            }
          : module
      )
    }));
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => 
        i === moduleIndex 
          ? {
              ...module,
              lessons: module.lessons.filter((_, j) => j !== lessonIndex)
            }
          : module
      )
    }));
  };

  const handleSubmit = () => {
    if (courseData.title.trim()) {
      onCreateCourse(courseData);
      setCourseData({
        title: "",
        description: "",
        modules: []
      });
      setStep(1);
      setOpen(false);
    }
  };

  const handleClose = () => {
    setCourseData({
      title: "",
      description: "",
      modules: []
    });
    setStep(1);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-course">
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Course - Step {step} of 3</DialogTitle>
          <DialogDescription>
            {step === 1 && "Enter basic course information"}
            {step === 2 && "Add modules to organize your course content"}
            {step === 3 && "Add lessons to each module"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="course-title">Course Title</Label>
              <Input 
                id="course-title" 
                value={courseData.title}
                onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Biblical Leadership Foundations"
                data-testid="input-course-title"
              />
            </div>
            <div>
              <Label htmlFor="course-description">Description</Label>
              <Textarea 
                id="course-description"
                value={courseData.description}
                onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students will learn in this course"
                data-testid="textarea-course-description"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Course Modules</h3>
              <Button type="button" size="sm" onClick={addModule} data-testid="button-add-module">
                <Plus className="w-4 h-4 mr-1" />
                Add Module
              </Button>
            </div>
            {courseData.modules.map((module, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Module {index + 1}</h4>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => removeModule(index)}
                      data-testid={`button-remove-module-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    value={module.title}
                    onChange={(e) => updateModule(index, 'title', e.target.value)}
                    placeholder="Module title"
                    data-testid={`input-module-title-${index}`}
                  />
                  <Textarea
                    value={module.description}
                    onChange={(e) => updateModule(index, 'description', e.target.value)}
                    placeholder="Module description"
                    data-testid={`textarea-module-description-${index}`}
                  />
                </div>
              </Card>
            ))}
            {courseData.modules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No modules added yet. Click "Add Module" to get started.
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Course Lessons</h3>
            {courseData.modules.map((module, moduleIndex) => (
              <Card key={moduleIndex} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{module.title || `Module ${moduleIndex + 1}`}</h4>
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={() => addLesson(moduleIndex)}
                      data-testid={`button-add-lesson-${moduleIndex}`}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Lesson
                    </Button>
                  </div>
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lessonIndex} className="border rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium">Lesson {lessonIndex + 1}</span>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline"
                          onClick={() => removeLesson(moduleIndex, lessonIndex)}
                          data-testid={`button-remove-lesson-${moduleIndex}-${lessonIndex}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        value={lesson.title}
                        onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                        placeholder="Lesson title"
                        data-testid={`input-lesson-title-${moduleIndex}-${lessonIndex}`}
                      />
                      <Textarea
                        value={lesson.content}
                        onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'content', e.target.value)}
                        placeholder="Lesson content and teaching material"
                        rows={3}
                        data-testid={`textarea-lesson-content-${moduleIndex}-${lessonIndex}`}
                      />
                      <Input
                        value={lesson.video_url || ""}
                        onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'video_url', e.target.value)}
                        placeholder="Video URL (optional)"
                        data-testid={`input-lesson-video-${moduleIndex}-${lessonIndex}`}
                      />
                    </div>
                  ))}
                  {module.lessons.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No lessons in this module yet.
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(step - 1)}
                data-testid="button-prev-step"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
              Cancel
            </Button>
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)} 
                disabled={step === 1 && !courseData.title.trim()}
                data-testid="button-next-step"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} data-testid="button-submit-course">
                Create Course
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserRoleDialog({ user, onUpdateRole }: { user: User; onUpdateRole: (role: string) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);

  const handleSubmit = () => {
    if (selectedRole !== user.role) {
      onUpdateRole(selectedRole);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-edit-user-${user.id}`}>
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User Role</DialogTitle>
          <DialogDescription>Change the role for {user.firstName} {user.lastName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="user-role">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger data-testid="select-user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-role">
            Cancel
          </Button>
          <Button onClick={handleSubmit} data-testid="button-update-role">
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RespondToDiscussionDialog({ discussionId, onRespond }: { discussionId: number; onRespond: (content: string) => void }) {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState("");

  const handleSubmit = () => {
    if (response.trim()) {
      onRespond(response);
      setResponse("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-respond-${discussionId}`}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Respond
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Respond to Discussion</DialogTitle>
          <DialogDescription>Post a response to this discussion</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="response-content">Your Response</Label>
            <Textarea 
              id="response-content"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Enter your response"
              rows={4}
              data-testid="textarea-discussion-response"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-response">
            Cancel
          </Button>
          <Button onClick={handleSubmit} data-testid="button-submit-response">
            Post Response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Test Email Section Component
function TestEmailSection() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Test Email from PKCM LMS");
  const [message, setMessage] = useState("This is a test email to verify email functionality is working correctly.");
  const { toast } = useToast();

  const testEmailMutation = useMutation({
    mutationFn: async (data: { email: string; subject: string; message: string }) => {
      const response = await apiRequest("POST", "/api/admin/test-email", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test email sent successfully!",
      });
      setEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const handleSendTestEmail = () => {
    if (!email.trim() || !subject.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all email fields",
        variant: "destructive",
      });
      return;
    }
    testEmailMutation.mutate({ email, subject, message });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Test Email</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="test-email">Email Address</Label>
          <Input
            id="test-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="recipient@example.com"
            data-testid="input-test-email"
          />
        </div>
        <div>
          <Label htmlFor="test-subject">Subject</Label>
          <Input
            id="test-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            data-testid="input-test-subject"
          />
        </div>
        <div>
          <Label htmlFor="test-message">Message</Label>
          <Textarea
            id="test-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Email message content"
            rows={3}
            data-testid="textarea-test-message"
          />
        </div>
        <Button 
          onClick={handleSendTestEmail}
          disabled={testEmailMutation.isPending}
          data-testid="button-send-test-email"
        >
          {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
        </Button>
      </div>
    </div>
  );
}

// Test SMS Section Component
function TestSMSSection() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("This is a test SMS from PKCM Leadership and Ministry Class to verify SMS functionality is working correctly.");
  const { toast } = useToast();

  const testSMSMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      const response = await apiRequest("POST", "/api/admin/test-sms", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test SMS sent successfully!",
      });
      setPhoneNumber("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test SMS",
        variant: "destructive",
      });
    },
  });

  const handleSendTestSMS = () => {
    if (!phoneNumber.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in phone number and message",
        variant: "destructive",
      });
      return;
    }
    testSMSMutation.mutate({ phoneNumber, message });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Test SMS</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="test-phone">Phone Number</Label>
          <Input
            id="test-phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
            data-testid="input-test-phone"
          />
          <p className="text-sm text-gray-500 mt-1">
            Include country code (e.g., +1 for US)
          </p>
        </div>
        <div>
          <Label htmlFor="test-sms-message">Message</Label>
          <Textarea
            id="test-sms-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="SMS message content"
            rows={3}
            data-testid="textarea-test-sms-message"
          />
        </div>
        <Button 
          onClick={handleSendTestSMS}
          disabled={testSMSMutation.isPending}
          data-testid="button-send-test-sms"
        >
          {testSMSMutation.isPending ? "Sending..." : "Send Test SMS"}
        </Button>
      </div>
    </div>
  );
}