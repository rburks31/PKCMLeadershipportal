import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, MessageSquare, Users, BookOpen, Loader2 } from "lucide-react";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  sendEmail: z.boolean().default(true),
  sendSMS: z.boolean().default(false),
  recipientType: z.enum(["all", "students", "instructors", "course"]),
  courseId: z.string().optional(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnouncementDialog({ open, onOpenChange }: AnnouncementDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      message: "",
      sendEmail: true,
      sendSMS: false,
      recipientType: "all",
    },
  });

  // Get courses for course-specific announcements
  const { data: courses } = useQuery({
    queryKey: ["/api/admin/courses"],
    enabled: open,
  });

  // Get user count for display
  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: open,
  });

  const sendAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      const response = await apiRequest("POST", "/api/admin/announcements", data);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Announcement Sent",
        description: `Successfully sent to ${result.recipientCount} recipients`,
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Announcement",
        description: error.message || "An error occurred while sending the announcement",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    if (!data.sendEmail && !data.sendSMS) {
      toast({
        title: "Select Communication Method",
        description: "Please select at least one communication method (Email or SMS)",
        variant: "destructive",
      });
      return;
    }

    sendAnnouncementMutation.mutate(data);
  };

  const recipientType = form.watch("recipientType");

  const getRecipientCount = () => {
    if (!analytics) return 0;
    
    switch (recipientType) {
      case "all":
        return parseInt((analytics as any).total_users || "0");
      case "students":
        return parseInt((analytics as any).student_count || "0");
      case "instructors":
        return parseInt((analytics as any).instructor_count || "0");
      case "course":
        // This would need to be calculated based on course enrollments
        return "Course enrollees";
      default:
        return 0;
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send Announcement
          </DialogTitle>
          <DialogDescription>
            Send important updates and notifications to your users via email and SMS.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Announcement Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter announcement title..."
                      data-testid="input-announcement-title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your announcement message..."
                      className="min-h-[120px]"
                      data-testid="input-announcement-message"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Keep your message clear and concise. This will be sent to all selected recipients.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recipients */}
            <FormField
              control={form.control}
              name="recipientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-recipient-type">
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          All Users ({getRecipientCount()})
                        </div>
                      </SelectItem>
                      <SelectItem value="students">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Students Only
                        </div>
                      </SelectItem>
                      <SelectItem value="instructors">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Instructors Only
                        </div>
                      </SelectItem>
                      <SelectItem value="course">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Specific Course
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course Selection (if course-specific) */}
            {recipientType === "course" && (
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-course">
                          <SelectValue placeholder="Choose a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses && Array.isArray(courses) ? courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Communication Methods */}
            <div className="space-y-4">
              <FormLabel>Communication Methods</FormLabel>
              
              <FormField
                control={form.control}
                name="sendEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-send-email"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send via Email
                      </FormLabel>
                      <FormDescription>
                        Send announcement to user email addresses
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendSMS"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-send-sms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Send via SMS
                      </FormLabel>
                      <FormDescription>
                        Send announcement to user phone numbers (requires phone numbers)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-announcement"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={sendAnnouncementMutation.isPending}
                data-testid="button-send-announcement"
              >
                {sendAnnouncementMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Announcement"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}