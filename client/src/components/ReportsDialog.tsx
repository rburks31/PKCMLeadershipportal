import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  MessageCircle, 
  GraduationCap,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Activity
} from "lucide-react";
import { format } from "date-fns";

interface ReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportsDialog({ open, onOpenChange }: ReportsDialogProps) {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: open,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/admin/activities"],
    enabled: open,
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/admin/courses"],
    enabled: open,
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: open,
  });

  // Calculate additional metrics
  const getCompletionRate = () => {
    if (!analytics?.completion_rate) return "0%";
    return `${Math.round(parseFloat(analytics.completion_rate))}%`;
  };

  const getActiveStudents = () => {
    if (!users) return 0;
    return users.filter((user: any) => user.role === "student").length;
  };

  const getActiveInstructors = () => {
    if (!users) return 0;
    return users.filter((user: any) => user.role === "instructor").length;
  };

  const getPublishedCourses = () => {
    if (!courses) return 0;
    return courses.filter((course: any) => course.isPublished).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Platform Analytics & Reports
          </DialogTitle>
          <DialogDescription>
            Comprehensive overview of platform usage, student progress, and system activity.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-total-users">
                    {analyticsLoading ? "..." : analytics?.total_users || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getActiveStudents()} students, {getActiveInstructors()} instructors
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-total-courses">
                    {analyticsLoading ? "..." : analytics?.total_courses || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getPublishedCourses()} published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Course Enrollments</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-enrollments">
                    {analyticsLoading ? "..." : analytics?.total_enrollments || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active enrollments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-completion-rate">
                    {analyticsLoading ? "..." : getCompletionRate()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average course completion
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Course Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Course Performance
                </CardTitle>
                <CardDescription>
                  Overview of course engagement and enrollment statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courses && courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.map((course: any) => (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium" data-testid={`course-title-${course.id}`}>
                            {course.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Created {format(new Date(course.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={course.isPublished ? "default" : "secondary"}>
                            {course.isPublished ? "Published" : "Draft"}
                          </Badge>
                          <div className="text-right">
                            <div className="font-medium">0 enrollments</div>
                            <div className="text-sm text-muted-foreground">0% completion</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No courses available yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent System Activity
                </CardTitle>
                <CardDescription>
                  Latest administrative actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice(0, 10).map((activity: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <div className="flex-1">
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.details && typeof activity.details === 'object' 
                              ? Object.entries(activity.details).map(([key, value]) => 
                                  `${key}: ${value}`
                                ).join(", ")
                              : activity.details}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {format(new Date(activity.createdAt), "MMM d, HH:mm")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recent activity to display
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Discussion Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Discussion Activity
                </CardTitle>
                <CardDescription>
                  Community engagement and discussion statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold" data-testid="metric-active-discussions">
                      {analyticsLoading ? "..." : analytics?.active_discussions || "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Discussions</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">This Week</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Avg. Response Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}