import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, Video, VideoIcon, ExternalLink, Plus, Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const createLiveClassSchema = z.object({
  courseId: z.number().min(1, "Course is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledAt: z.string().min(1, "Scheduled date and time is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  platform: z.enum(["zoom", "google_meet"], { message: "Platform is required" }),
  meetingPassword: z.string().optional(),
  maxAttendees: z.number().min(1).max(1000).default(100)
});

type CreateLiveClassData = z.infer<typeof createLiveClassSchema>;

function CreateLiveClassDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  const form = useForm<CreateLiveClassData>({
    resolver: zodResolver(createLiveClassSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 60,
      platform: "zoom",
      maxAttendees: 100
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateLiveClassData) => {
      return await apiRequest("/api/live-classes", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Live class scheduled successfully!" });
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/live-classes/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-classes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule live class",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateLiveClassData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-live-class">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Live Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Schedule New Live Class</DialogTitle>
          <DialogDescription>
            Create a new live class session with Zoom or Google Meet integration.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                    <FormControl>
                      <SelectTrigger data-testid="select-course">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(courses as any)?.map?.((course: any) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter class title" {...field} data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Class description (optional)" {...field} data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} data-testid="input-scheduled-at" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="15"
                        max="480"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-platform">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="google_meet">Google Meet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Attendees</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-max-attendees"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="meetingPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Password (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meeting password" {...field} data-testid="input-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-schedule">
                {createMutation.isPending ? "Scheduling..." : "Schedule Class"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function LiveClassCard({ liveClass, onJoin, onRegister }: { 
  liveClass: any; 
  onJoin?: (id: number) => void;
  onRegister?: (id: number) => void;
}) {
  const scheduledDate = new Date(liveClass.scheduled_at);
  const isUpcoming = scheduledDate > new Date();
  const isLive = liveClass.status === "live";
  const canJoin = liveClass.can_join || liveClass.canJoin;

  const getStatusBadge = () => {
    switch (liveClass.status) {
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "live":
        return <Badge variant="default" className="bg-red-500 hover:bg-red-600">Live</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{liveClass.status}</Badge>;
    }
  };

  const getPlatformIcon = () => {
    return liveClass.platform === "zoom" ? (
      <VideoIcon className="w-4 h-4" />
    ) : (
      <Video className="w-4 h-4" />
    );
  };

  return (
    <Card data-testid={`card-live-class-${liveClass.id}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{liveClass.title}</CardTitle>
            <CardDescription className="flex items-center space-x-2">
              {getPlatformIcon()}
              <span>{liveClass.platform === "zoom" ? "Zoom" : "Google Meet"}</span>
              {liveClass.course_title && (
                <>
                  <span>•</span>
                  <span>{liveClass.course_title}</span>
                </>
              )}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {liveClass.description && (
          <p className="text-sm text-muted-foreground">{liveClass.description}</p>
        )}
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <CalendarIcon className="w-4 h-4" />
            <span>{scheduledDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{liveClass.duration || 60} min</span>
          </div>
        </div>

        {liveClass.instructor_first_name && (
          <p className="text-sm">
            <span className="font-medium">Instructor:</span> {liveClass.instructor_first_name} {liveClass.instructor_last_name}
          </p>
        )}

        <div className="flex space-x-2">
          {isLive && canJoin && liveClass.meeting_url && (
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (onJoin) onJoin(liveClass.id);
                window.open(liveClass.meeting_url, '_blank');
              }}
              data-testid={`button-join-${liveClass.id}`}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Join Live
            </Button>
          )}
          
          {isUpcoming && !liveClass.attendance_status && onRegister && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onRegister(liveClass.id)}
              data-testid={`button-register-${liveClass.id}`}
            >
              Register
            </Button>
          )}
          
          {isUpcoming && liveClass.attendance_status === "registered" && liveClass.meeting_url && (
            <Button 
              size="sm"
              onClick={() => {
                if (onJoin) onJoin(liveClass.id);
                window.open(liveClass.meeting_url, '_blank');
              }}
              data-testid={`button-join-scheduled-${liveClass.id}`}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Join Meeting
            </Button>
          )}

          {liveClass.recording_url && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(liveClass.recording_url, '_blank')}
              data-testid={`button-recording-${liveClass.id}`}
            >
              <Video className="w-4 h-4 mr-2" />
              Recording
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LiveClassesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isInstructor = (user as any)?.role === "admin" || (user as any)?.role === "instructor";

  const { data: upcomingClasses = [], isLoading: upcomingLoading } = useQuery({
    queryKey: ["/api/live-classes/upcoming"],
  });

  const { data: adminClasses = [], isLoading: adminLoading } = useQuery({
    queryKey: ["/api/admin/live-classes"],
    enabled: isInstructor,
  });

  const registerMutation = useMutation({
    mutationFn: async (classId: number) => {
      return await apiRequest(`/api/live-classes/${classId}/register`, "POST");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Successfully registered for live class!" });
      queryClient.invalidateQueries({ queryKey: ["/api/live-classes/upcoming"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register for live class",
        variant: "destructive",
      });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (classId: number) => {
      return await apiRequest(`/api/live-classes/${classId}/join`, "POST");
    },
    onSuccess: () => {
      toast({ title: "Joined", description: "Attendance recorded successfully!" });
    },
  });

  const handleRegister = (classId: number) => {
    registerMutation.mutate(classId);
  };

  const handleJoin = (classId: number) => {
    joinMutation.mutate(classId);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Live Classes</h1>
          <p className="text-muted-foreground">
            Join live virtual classes with Zoom and Google Meet integration
          </p>
        </div>
        {isInstructor && <CreateLiveClassDialog />}
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
          {isInstructor && <TabsTrigger value="manage">Manage Classes</TabsTrigger>}
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingLoading ? (
            <div className="text-center py-8">Loading upcoming classes...</div>
          ) : (upcomingClasses as any[]).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Classes</h3>
                <p className="text-muted-foreground">
                  There are no live classes scheduled at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(upcomingClasses as any[]).map((liveClass: any) => (
                <LiveClassCard
                  key={liveClass.id}
                  liveClass={liveClass}
                  onJoin={handleJoin}
                  onRegister={handleRegister}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {isInstructor && (
          <TabsContent value="manage" className="space-y-4">
            {adminLoading ? (
              <div className="text-center py-8">Loading classes...</div>
            ) : (adminClasses as any[]).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Classes Scheduled</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by scheduling your first live class.
                  </p>
                  <CreateLiveClassDialog />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {(adminClasses as any[]).map((liveClass: any) => (
                  <LiveClassCard
                    key={liveClass.id}
                    liveClass={liveClass}
                    onJoin={handleJoin}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}