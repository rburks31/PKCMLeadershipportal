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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Mail, 
  MessageSquare, 
  Globe, 
  Shield, 
  Bell,
  Database,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

const platformSettingsSchema = z.object({
  platformName: z.string().min(1, "Platform name is required"),
  platformDescription: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal("")),
  allowRegistration: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(false),
  enableSMSNotifications: z.boolean().default(true),
  enableEmailNotifications: z.boolean().default(true),
  maxCoursesPerUser: z.number().min(1).default(10),
  sessionTimeoutMinutes: z.number().min(5).default(60),
});

type PlatformSettingsFormData = z.infer<typeof platformSettingsSchema>;

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);

  const form = useForm<PlatformSettingsFormData>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      platformName: "PKCM Leadership and Ministry Class",
      platformDescription: "Empowering pastors and religious educators through advanced digital learning technologies",
      supportEmail: "support@pkcm.edu",
      allowRegistration: true,
      requireEmailVerification: false,
      enableSMSNotifications: true,
      enableEmailNotifications: true,
      maxCoursesPerUser: 10,
      sessionTimeoutMinutes: 60,
    },
  });

  // Get current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    enabled: open,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: PlatformSettingsFormData) => {
      const response = await apiRequest("PUT", "/api/admin/settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Platform settings have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Settings",
        description: error.message || "An error occurred while saving settings",
        variant: "destructive",
      });
    },
  });

  // Test email connection
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/test-email", {
        to: "admin@dev.local",
        subject: "PKCM Email Test",
        message: "This is a test email to verify SendGrid integration is working properly."
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Test Successful",
        description: "Email sent successfully via SendGrid",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Test Failed",
        description: error.message || "Could not send test email",
        variant: "destructive",
      });
    },
  });

  // Test SMS connection
  const testSMSMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/test-sms", {
        to: "+1234567890",
        message: "PKCM SMS Test: This is a test message to verify Twilio integration is working properly."
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMS Test Successful",
        description: "SMS sent successfully via Twilio",
      });
    },
    onError: (error: any) => {
      toast({
        title: "SMS Test Failed",
        description: error.message || "Could not send test SMS",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlatformSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const handleTestEmail = () => {
    setTestingEmail(true);
    testEmailMutation.mutate();
    setTimeout(() => setTestingEmail(false), 3000);
  };

  const handleTestSMS = () => {
    setTestingSMS(true);
    testSMSMutation.mutate();
    setTimeout(() => setTestingSMS(false), 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Platform Settings
          </DialogTitle>
          <DialogDescription>
            Configure platform-wide settings, communication preferences, and system parameters.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* General Settings */}
              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Platform Information
                    </CardTitle>
                    <CardDescription>
                      Basic information about your learning platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="platformName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter platform name..."
                              data-testid="input-platform-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="platformDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your platform..."
                              data-testid="input-platform-description"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This description will appear on public pages
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supportEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="support@yourplatform.com"
                              data-testid="input-support-email"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Email address for user support inquiries
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Communications Settings */}
              <TabsContent value="communications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Configuration
                    </CardTitle>
                    <CardDescription>
                      Email service settings and testing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="enableEmailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Email Notifications
                            </FormLabel>
                            <FormDescription>
                              Allow the platform to send email notifications to users
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-email-notifications"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestEmail}
                        disabled={testingEmail || testEmailMutation.isPending}
                        data-testid="button-test-email"
                      >
                        {(testingEmail || testEmailMutation.isPending) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testing Email...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Test Email Connection
                          </>
                        )}
                      </Button>
                      {testEmailMutation.isSuccess && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      {testEmailMutation.isError && (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      SMS Configuration
                    </CardTitle>
                    <CardDescription>
                      SMS service settings and testing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="enableSMSNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable SMS Notifications
                            </FormLabel>
                            <FormDescription>
                              Allow the platform to send SMS notifications to users
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-sms-notifications"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestSMS}
                        disabled={testingSMS || testSMSMutation.isPending}
                        data-testid="button-test-sms"
                      >
                        {(testingSMS || testSMSMutation.isPending) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testing SMS...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Test SMS Connection
                          </>
                        )}
                      </Button>
                      {testSMSMutation.isSuccess && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      {testSMSMutation.isError && (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      User Registration & Authentication
                    </CardTitle>
                    <CardDescription>
                      Control user access and registration settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="allowRegistration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow User Registration
                            </FormLabel>
                            <FormDescription>
                              Enable new users to register for the platform
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-allow-registration"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requireEmailVerification"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Require Email Verification
                            </FormLabel>
                            <FormDescription>
                              Users must verify their email before accessing the platform
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-email-verification"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* System Settings */}
              <TabsContent value="system" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      System Limits & Performance
                    </CardTitle>
                    <CardDescription>
                      Configure system limits and performance settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="maxCoursesPerUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Courses Per User</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              data-testid="input-max-courses"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Limit the number of courses a user can enroll in
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sessionTimeoutMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (Minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="5"
                              data-testid="input-session-timeout"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            How long user sessions should remain active
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-settings"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
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