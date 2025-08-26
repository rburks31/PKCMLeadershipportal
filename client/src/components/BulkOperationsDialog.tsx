import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Mail, 
  MessageSquare, 
  Upload,
  Download,
  Trash2,
  Edit,
  UserPlus,
  Loader2,
  AlertTriangle
} from "lucide-react";

const bulkEmailSchema = z.object({
  recipients: z.enum(["all", "students", "instructors", "admins", "selected"]),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  includeWelcomeKit: z.boolean().default(false),
});

const bulkSmsSchema = z.object({
  recipients: z.enum(["all", "students", "instructors", "selected"]),
  message: z.string().min(1, "Message is required").max(160, "SMS messages must be 160 characters or less"),
});

const bulkUserImportSchema = z.object({
  role: z.enum(["student", "instructor"]),
  autoEnrollCourse: z.string().optional(),
  sendWelcomeEmail: z.boolean().default(true),
});

type BulkEmailFormData = z.infer<typeof bulkEmailSchema>;
type BulkSmsFormData = z.infer<typeof bulkSmsSchema>;
type BulkUserImportFormData = z.infer<typeof bulkUserImportSchema>;

interface BulkOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUsers?: string[];
}

export function BulkOperationsDialog({ open, onOpenChange, selectedUsers = [] }: BulkOperationsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const emailForm = useForm<BulkEmailFormData>({
    resolver: zodResolver(bulkEmailSchema),
    defaultValues: {
      recipients: selectedUsers.length > 0 ? "selected" : "all",
      includeWelcomeKit: false,
    },
  });

  const smsForm = useForm<BulkSmsFormData>({
    resolver: zodResolver(bulkSmsSchema),
    defaultValues: {
      recipients: selectedUsers.length > 0 ? "selected" : "all",
    },
  });

  const importForm = useForm<BulkUserImportFormData>({
    resolver: zodResolver(bulkUserImportSchema),
    defaultValues: {
      role: "student",
      sendWelcomeEmail: true,
    },
  });

  const bulkEmailMutation = useMutation({
    mutationFn: async (data: BulkEmailFormData) => {
      const payload = {
        ...data,
        selectedUserIds: data.recipients === "selected" ? selectedUsers : undefined,
      };
      const response = await apiRequest("POST", "/api/admin/bulk-email", payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Bulk email has been sent successfully",
      });
      emailForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Email Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkSmsMutation = useMutation({
    mutationFn: async (data: BulkSmsFormData) => {
      const payload = {
        ...data,
        selectedUserIds: data.recipients === "selected" ? selectedUsers : undefined,
      };
      const response = await apiRequest("POST", "/api/admin/bulk-sms", payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMS Sent",
        description: "Bulk SMS has been sent successfully",
      });
      smsForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "SMS Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const userImportMutation = useMutation({
    mutationFn: async (data: BulkUserImportFormData) => {
      if (!csvFile) {
        throw new Error("Please select a CSV file");
      }

      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("role", data.role);
      formData.append("sendWelcomeEmail", data.sendWelcomeEmail.toString());
      if (data.autoEnrollCourse) {
        formData.append("autoEnrollCourse", data.autoEnrollCourse);
      }

      const response = await fetch("/api/admin/bulk-import-users", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.imported} users. ${data.failed} failed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCsvFile(null);
      importForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadUsersMutation = useMutation({
    mutationFn: async (format: "csv" | "excel") => {
      const response = await apiRequest("GET", `/api/admin/export-users?format=${format}`);
      return response.blob();
    },
    onSuccess: (blob, format) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: `Users exported successfully as ${format.toUpperCase()}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
    }
  };

  const onEmailSubmit = (data: BulkEmailFormData) => {
    bulkEmailMutation.mutate(data);
  };

  const onSmsSubmit = (data: BulkSmsFormData) => {
    bulkSmsMutation.mutate(data);
  };

  const onImportSubmit = (data: BulkUserImportFormData) => {
    userImportMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="bulk-operations-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Operations
          </DialogTitle>
          <DialogDescription>
            Perform bulk operations on users, send mass communications, or import/export data.
            {selectedUsers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedUsers.length} users selected
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email" data-testid="tab-bulk-email">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" data-testid="tab-bulk-sms">
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="import" data-testid="tab-bulk-import">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="export" data-testid="tab-bulk-export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Bulk Email Tab */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send Bulk Email</CardTitle>
                <CardDescription>
                  Send emails to multiple users at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="recipients"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipients</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-email-recipients">
                                <SelectValue placeholder="Select recipients" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">All Users</SelectItem>
                              <SelectItem value="students">Students Only</SelectItem>
                              <SelectItem value="instructors">Instructors Only</SelectItem>
                              <SelectItem value="admins">Admins Only</SelectItem>
                              {selectedUsers.length > 0 && (
                                <SelectItem value="selected">Selected Users ({selectedUsers.length})</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Email subject" data-testid="input-email-subject" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Email message..." 
                              rows={6}
                              data-testid="textarea-email-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="includeWelcomeKit"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-include-welcome-kit"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include Welcome Kit</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Attach platform welcome materials and course catalog
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={bulkEmailMutation.isPending}
                      data-testid="button-send-bulk-email"
                    >
                      {bulkEmailMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk SMS Tab */}
          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send Bulk SMS</CardTitle>
                <CardDescription>
                  Send SMS messages to multiple users at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...smsForm}>
                  <form onSubmit={smsForm.handleSubmit(onSmsSubmit)} className="space-y-4">
                    <FormField
                      control={smsForm.control}
                      name="recipients"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipients</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-sms-recipients">
                                <SelectValue placeholder="Select recipients" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">All Users</SelectItem>
                              <SelectItem value="students">Students Only</SelectItem>
                              <SelectItem value="instructors">Instructors Only</SelectItem>
                              {selectedUsers.length > 0 && (
                                <SelectItem value="selected">Selected Users ({selectedUsers.length})</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smsForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="SMS message..." 
                              rows={4}
                              maxLength={160}
                              data-testid="textarea-sms-message"
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            {field.value?.length || 0}/160 characters
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={bulkSmsMutation.isPending}
                      data-testid="button-send-bulk-sms"
                    >
                      {bulkSmsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send SMS
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Users</CardTitle>
                <CardDescription>
                  Import users from a CSV file. Required columns: email, firstName, lastName
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...importForm}>
                  <form onSubmit={importForm.handleSubmit(onImportSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="csv-file">CSV File</Label>
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        data-testid="input-csv-file"
                      />
                      {csvFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {csvFile.name}
                        </p>
                      )}
                    </div>

                    <FormField
                      control={importForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-import-role">
                                <SelectValue placeholder="Select default role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="instructor">Instructor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={importForm.control}
                      name="sendWelcomeEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-send-welcome-email"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Send Welcome Email</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Send welcome emails to newly imported users
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={userImportMutation.isPending || !csvFile}
                      data-testid="button-import-users"
                    >
                      {userImportMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Import Users
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>
                  Export user data and analytics for reporting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => downloadUsersMutation.mutate("csv")}
                    disabled={downloadUsersMutation.isPending}
                    data-testid="button-export-csv"
                  >
                    {downloadUsersMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export as CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadUsersMutation.mutate("excel")}
                    disabled={downloadUsersMutation.isPending}
                    data-testid="button-export-excel"
                  >
                    {downloadUsersMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export as Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}