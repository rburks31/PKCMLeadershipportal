import { useState } from "react";
import { 
  Plus, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Calendar,
  Settings,
  FileText,
  Video,
  UserPlus,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHotkeys } from "react-hotkeys-hook";
import { AdminTooltip } from "./AdminTooltip";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  shortcut: string;
  onClick: () => void;
  badge?: string;
}

interface AdminQuickActionsProps {
  onCreateCourse: () => void;
  onAddUser: () => void;
  onScheduleClass: () => void;
  onSendAnnouncement: () => void;
  onViewReports: () => void;
  onManageSettings: () => void;
}

export function AdminQuickActions({
  onCreateCourse,
  onAddUser,
  onScheduleClass,
  onSendAnnouncement,
  onViewReports,
  onManageSettings
}: AdminQuickActionsProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: "create-course",
      title: "Create Course",
      description: "Start building a new discipleship course",
      icon: BookOpen,
      color: "bg-pastoral-blue/10 hover:bg-pastoral-blue/20 text-pastoral-blue",
      shortcut: "Ctrl+N",
      onClick: onCreateCourse,
      badge: "Popular"
    },
    {
      id: "add-user",
      title: "Add User",
      description: "Invite new students or instructors",
      icon: UserPlus,
      color: "bg-pastoral-green/10 hover:bg-pastoral-green/20 text-pastoral-green",
      shortcut: "Ctrl+U",
      onClick: onAddUser
    },
    {
      id: "schedule-class",
      title: "Schedule Live Class",
      description: "Set up a virtual classroom session",
      icon: Video,
      color: "bg-pastoral-gold/10 hover:bg-pastoral-gold/20 text-pastoral-gold",
      shortcut: "Ctrl+L",
      onClick: onScheduleClass
    },
    {
      id: "send-announcement",
      title: "Send Announcement",
      description: "Communicate with all users instantly",
      icon: Mail,
      color: "bg-purple-100 hover:bg-purple-200 text-purple-700",
      shortcut: "Ctrl+M",
      onClick: onSendAnnouncement
    },
    {
      id: "view-reports",
      title: "View Reports",
      description: "Access analytics and progress data",
      icon: FileText,
      color: "bg-orange-100 hover:bg-orange-200 text-orange-700",
      shortcut: "Ctrl+R",
      onClick: onViewReports
    },
    {
      id: "manage-settings",
      title: "Platform Settings",
      description: "Configure system preferences",
      icon: Settings,
      color: "bg-gray-100 hover:bg-gray-200 text-gray-700",
      shortcut: "Ctrl+,",
      onClick: onManageSettings
    }
  ];

  // Register keyboard shortcuts
  useHotkeys("ctrl+n", (e) => { e.preventDefault(); onCreateCourse(); });
  useHotkeys("ctrl+u", (e) => { e.preventDefault(); onAddUser(); });
  useHotkeys("ctrl+l", (e) => { e.preventDefault(); onScheduleClass(); });
  useHotkeys("ctrl+m", (e) => { e.preventDefault(); onSendAnnouncement(); });
  useHotkeys("ctrl+r", (e) => { e.preventDefault(); onViewReports(); });
  useHotkeys("ctrl+comma", (e) => { e.preventDefault(); onManageSettings(); });

  return (
    <Card data-testid="admin-quick-actions">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Frequently used admin functions with keyboard shortcuts
            </CardDescription>
          </div>
          <AdminTooltip
            title="Quick Actions Panel"
            description="Use these shortcuts to quickly access common admin tasks. Each action has a keyboard shortcut for faster navigation. Hover over actions to see descriptions and shortcuts."
            feature="quick-actions"
            position="left"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                onMouseEnter={() => setHoveredAction(action.id)}
                onMouseLeave={() => setHoveredAction(null)}
                className={`
                  relative p-4 rounded-lg border transition-all duration-200 text-left
                  ${action.color}
                  hover:scale-105 hover:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-pastoral-blue/50
                `}
                data-testid={`quick-action-${action.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                
                <h3 className="font-medium text-sm mb-1">{action.title}</h3>
                <p className="text-xs opacity-80 leading-tight mb-2">
                  {action.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono bg-black/10 px-2 py-1 rounded">
                    {action.shortcut}
                  </span>
                  {hoveredAction === action.id && (
                    <span className="text-xs opacity-60">Click to use</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Use keyboard shortcuts for even faster access. 
            All shortcuts work when you're anywhere in the admin panel.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}