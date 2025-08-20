import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  User, 
  BookOpen, 
  MessageSquare, 
  Calendar,
  UserPlus,
  FileText,
  Video,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AdminTooltip } from "./AdminTooltip";
import type { AdminActivity } from "@shared/schema";

interface ActivityItemProps {
  activity: AdminActivity;
}

function getActivityIcon(entityType: string, action: string) {
  switch (entityType) {
    case "user":
      return action === "created" ? UserPlus : User;
    case "course":
      return BookOpen;
    case "lesson":
      return FileText;
    case "discussion":
      return MessageSquare;
    case "live_class":
      return Video;
    case "settings":
      return Settings;
    default:
      return Activity;
  }
}

function getActivityColor(action: string) {
  switch (action) {
    case "created":
      return "text-green-600 bg-green-50";
    case "updated":
      return "text-blue-600 bg-blue-50";
    case "deleted":
      return "text-red-600 bg-red-50";
    case "completed":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

function formatTimeAgo(date: string | null) {
  if (!date) return "unknown";
  const now = new Date();
  const activityDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const IconComponent = getActivityIcon(activity.entityType, activity.action);
  const colorClasses = getActivityColor(activity.action);
  
  const getActivityDescription = () => {
    const details = activity.details as any;
    const entityName = details?.name || details?.title || `${activity.entityType} #${activity.entityId}`;
    
    switch (`${activity.action}_${activity.entityType}`) {
      case "created_course":
        return `Created new course "${entityName}"`;
      case "created_user":
        return `Added new user "${entityName}"`;
      case "created_lesson":
        return `Created lesson "${entityName}"`;
      case "created_live_class":
        return `Scheduled live class "${entityName}"`;
      case "updated_course":
        return `Updated course "${entityName}"`;
      case "updated_user":
        return `Updated user profile for "${entityName}"`;
      case "completed_lesson":
        return `User completed lesson "${entityName}"`;
      case "joined_live_class":
        return `User joined live class "${entityName}"`;
      default:
        return `${activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} ${activity.entityType} "${entityName}"`;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/30 rounded-lg transition-colors">
      <div className={`p-2 rounded-full ${colorClasses} flex-shrink-0`}>
        <IconComponent className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">
          {getActivityDescription()}
        </p>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(activity.createdAt)}
          </span>
          
          <Badge variant="outline" className="text-xs px-2 py-0">
            {activity.action}
          </Badge>
          
          {activity.details && (activity.details as any).priority && (
            <Badge variant="secondary" className="text-xs px-2 py-0">
              {(activity.details as any).priority}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminActivityFeed() {
  const [isLive, setIsLive] = useState(true);
  
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ["/api/admin/activities"],
    refetchInterval: isLive ? 5000 : false, // Refresh every 5 seconds when live
  });

  const recentActivities = Array.isArray(activities) ? activities.slice(0, 15) : []; // Show last 15 activities

  return (
    <Card className="h-[600px] flex flex-col" data-testid="admin-activity-feed">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity Feed
              {isLive && (
                <div className="flex items-center gap-1 ml-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Real-time platform activity and user interactions
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <AdminTooltip
              title="Real-time Activity Feed"
              description="This feed shows live activity across your platform including new enrollments, course completions, user registrations, and admin actions. Updates automatically every 5 seconds."
              feature="activity-feed"
              position="left"
            />
            
            <button
              onClick={() => setIsLive(!isLive)}
              className={`
                flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${isLive 
                  ? "bg-green-100 text-green-700 hover:bg-green-200" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
              data-testid="button-toggle-live-feed"
            >
              <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500" : "bg-gray-400"}`} />
              {isLive ? "Live" : "Paused"}
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <ScrollArea className="h-full pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Unable to load activity feed
              </p>
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-1">
              {recentActivities.map((activity: AdminActivity, index: number) => (
                <div key={activity.id}>
                  <ActivityItem activity={activity} />
                  {index < recentActivities.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Clock className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                No recent activity
              </p>
              <p className="text-xs text-muted-foreground">
                Activity will appear here as users interact with the platform
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}