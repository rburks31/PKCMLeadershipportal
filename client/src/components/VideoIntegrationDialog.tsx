import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Video, 
  Zap, 
  Globe, 
  Clock, 
  Users, 
  Calendar,
  Settings,
  Loader2,
  ExternalLink,
  CheckCircle2
} from "lucide-react";

const videoIntegrationSchema = z.object({
  provider: z.enum(["zoom", "meet", "teams", "videosdk", "custom"]),
  meetingTitle: z.string().min(1, "Meeting title is required"),
  meetingDescription: z.string().optional(),
  scheduledDateTime: z.string().min(1, "Date and time is required"),
  duration: z.number().min(15).max(480).default(60),
  maxParticipants: z.number().min(1).max(1000).default(100),
  isRecorded: z.boolean().default(false),
  requirePassword: z.boolean().default(true),
  enableWaitingRoom: z.boolean().default(true),
  enableChat: z.boolean().default(true),
  enableScreenShare: z.boolean().default(true),
  courseId: z.number().optional(),
  allowEarlyEntry: z.boolean().default(false),
});

type VideoIntegrationFormData = z.infer<typeof videoIntegrationSchema>;

interface VideoIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const videoProviders = [
  {
    id: "zoom",
    name: "Zoom",
    description: "Industry-leading video conferencing with advanced features",
    features: ["Recording", "Breakout Rooms", "Waiting Room", "Polls", "Whiteboard"],
    setup: "Requires Zoom SDK credentials",
    pricing: "Based on your Zoom plan"
  },
  {
    id: "meet",
    name: "Google Meet",
    description: "Integrated with Google Workspace, simple and reliable",
    features: ["Google Calendar Integration", "Live Captions", "Screen Sharing"],
    setup: "Requires Google Cloud API credentials",
    pricing: "Free for basic, paid for advanced features"
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Enterprise-grade communication platform",
    features: ["Office 365 Integration", "Recording", "Live Events", "Background Effects"],
    setup: "Requires Microsoft Graph API",
    pricing: "Based on Office 365 plan"
  },
  {
    id: "videosdk",
    name: "VideoSDK",
    description: "Developer-friendly platform with educational features",
    features: ["Interactive Whiteboard", "Breakout Rooms", "Polls", "Q&A", "RTMP Streaming"],
    setup: "Quick API integration",
    pricing: "10,000 free minutes/month, then usage-based"
  },
  {
    id: "custom",
    name: "Custom WebRTC",
    description: "Build your own video solution with WebRTC",
    features: ["Full Customization", "No Third-party Dependencies", "Self-hosted"],
    setup: "Complex development required",
    pricing: "Free (development costs apply)"
  }
];

export function VideoIntegrationDialog({ open, onOpenChange }: VideoIntegrationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState("zoom");

  const form = useForm<VideoIntegrationFormData>({
    resolver: zodResolver(videoIntegrationSchema),
    defaultValues: {
      provider: "zoom",
      meetingTitle: "",
      meetingDescription: "",
      scheduledDateTime: "",
      duration: 60,
      maxParticipants: 100,
      isRecorded: false,
      requirePassword: true,
      enableWaitingRoom: true,
      enableChat: true,
      enableScreenShare: true,
      allowEarlyEntry: false,
    },
  });

  // Get available courses for selection
  const { data: courses } = useQuery({
    queryKey: ["/api/admin/courses"],
    enabled: open,
  });

  // Create video meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: async (data: VideoIntegrationFormData) => {
      const response = await apiRequest("POST", "/api/admin/video-meetings", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Video Meeting Created",
        description: `Meeting "${data.title}" has been scheduled successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-classes"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Meeting",
        description: error.message || "An error occurred while creating the meeting",
        variant: "destructive",
      });
    },
  });

  // Test video provider connection
  const testConnectionMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", "/api/admin/test-video-provider", { provider });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Successful",
        description: `${selectedProvider} integration is working correctly`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to video provider",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VideoIntegrationFormData) => {
    createMeetingMutation.mutate(data);
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate(selectedProvider);
  };

  const selectedProviderData = videoProviders.find(p => p.id === selectedProvider);

  // Format datetime for HTML input
  const formatDateTimeLocal = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().slice(0, 16);
  };

  // Default to next hour
  const defaultDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return formatDateTimeLocal(now);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Video Platform Integration
          </DialogTitle>
          <DialogDescription>
            Set up live video classes and integrate with video conferencing platforms
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup Meeting</TabsTrigger>
            <TabsTrigger value="providers">Choose Provider</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Setup Meeting Tab */}
              <TabsContent value="setup" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Meeting Details
                    </CardTitle>
                    <CardDescription>
                      Configure your live video class session
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="meetingTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meeting Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Leadership Training Session 1"
                                data-testid="input-meeting-title"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="courseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Associated Course (Optional)</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger data-testid="select-course">
                                  <SelectValue placeholder="Select a course" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">No Course</SelectItem>
                                {(courses || []).map((course: any) => (
                                  <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="meetingDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Meeting agenda and details..."
                              data-testid="input-meeting-description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="scheduledDateTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date & Time</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                data-testid="input-scheduled-datetime"
                                {...field}
                                defaultValue={defaultDateTime()}
                              />
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
                                data-testid="input-duration"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>15 to 480 minutes</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxParticipants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Participants</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="1000"
                                data-testid="input-max-participants"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Choose Provider Tab */}
              <TabsContent value="providers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Video Platform Selection
                    </CardTitle>
                    <CardDescription>
                      Choose your preferred video conferencing platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform Provider</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {videoProviders.map((provider) => (
                              <Card 
                                key={provider.id}
                                className={`cursor-pointer transition-all ${
                                  field.value === provider.id 
                                    ? 'ring-2 ring-primary bg-primary/5' 
                                    : 'hover:shadow-md'
                                }`}
                                onClick={() => {
                                  field.onChange(provider.id);
                                  setSelectedProvider(provider.id);
                                }}
                              >
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                                    {field.value === provider.id && (
                                      <CheckCircle2 className="w-5 h-5 text-primary" />
                                    )}
                                  </div>
                                  <CardDescription className="text-sm">
                                    {provider.description}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap gap-1">
                                      {provider.features.slice(0, 3).map((feature) => (
                                        <Badge key={feature} variant="secondary" className="text-xs">
                                          {feature}
                                        </Badge>
                                      ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      <strong>Setup:</strong> {provider.setup}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      <strong>Pricing:</strong> {provider.pricing}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedProviderData && (
                      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Selected: {selectedProviderData.name}</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedProviderData.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleTestConnection}
                          disabled={testConnectionMutation.isPending}
                          data-testid="button-test-connection"
                        >
                          {testConnectionMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <Globe className="w-4 h-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Configuration Tab */}
              <TabsContent value="configuration" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Meeting Configuration
                    </CardTitle>
                    <CardDescription>
                      Advanced settings for your video meeting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Security Settings</h4>
                        
                        <FormField
                          control={form.control}
                          name="requirePassword"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Require Password</FormLabel>
                                <FormDescription className="text-sm">
                                  Participants must enter a password to join
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-require-password"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="enableWaitingRoom"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Waiting Room</FormLabel>
                                <FormDescription className="text-sm">
                                  Host admits participants manually
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-waiting-room"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="allowEarlyEntry"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Allow Early Entry</FormLabel>
                                <FormDescription className="text-sm">
                                  Participants can join before start time
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-early-entry"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Feature Settings</h4>

                        <FormField
                          control={form.control}
                          name="isRecorded"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Record Meeting</FormLabel>
                                <FormDescription className="text-sm">
                                  Automatically record the session
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-record-meeting"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="enableChat"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Chat</FormLabel>
                                <FormDescription className="text-sm">
                                  Allow participants to use text chat
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-enable-chat"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="enableScreenShare"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Screen Sharing</FormLabel>
                                <FormDescription className="text-sm">
                                  Allow participants to share their screen
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-screen-share"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-video"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMeetingMutation.isPending}
                  data-testid="button-create-meeting"
                >
                  {createMeetingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Meeting...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Create Video Meeting
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}