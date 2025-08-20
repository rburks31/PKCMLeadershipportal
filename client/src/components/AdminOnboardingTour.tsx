import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { X, Play, SkipForward } from "lucide-react";

const tourSteps: Step[] = [
  {
    target: '[data-testid="admin-dashboard-overview"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Welcome to the Admin Dashboard!</h3>
        <p className="text-sm">This overview shows key metrics about your ministry platform including student enrollment, course completion rates, and recent activity.</p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-testid="admin-nav-users"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">User Management</h3>
        <p className="text-sm">Manage all users in your system - students, instructors, and admins. You can view profiles, update roles, and track activity.</p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-testid="admin-nav-courses"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Course Management</h3>
        <p className="text-sm">Create, edit, and organize your ministry courses. Set up modules, lessons, and track student progress through your discipleship programs.</p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-testid="admin-nav-progress"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Progress Tracking</h3>
        <p className="text-sm">Monitor student progress across all courses. See completion rates, identify struggling students, and celebrate achievements.</p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-testid="admin-nav-discussions"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Discussion Management</h3>
        <p className="text-sm">Moderate course discussions, encourage community interaction, and ensure healthy biblical dialogue among students.</p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-testid="admin-quick-actions"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Quick Actions</h3>
        <p className="text-sm">Access frequently used admin functions quickly. Create courses, add users, send announcements, and more with just one click.</p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-testid="admin-activity-feed"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Real-time Activity Feed</h3>
        <p className="text-sm">Stay updated with live activity across your platform. See new enrollments, course completions, and user interactions as they happen.</p>
      </div>
    ),
    placement: "left",
  },
];

interface AdminOnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminOnboardingTour({ isOpen, onClose }: AdminOnboardingTourProps) {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setIsRunning(isOpen);
  }, [isOpen]);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, type, index } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setIsRunning(false);
      onClose();
      
      // Mark onboarding as completed
      if (user && (user as any).id) {
        try {
          await apiRequest("POST", "/api/admin/onboarding/complete", {
            step: "tour_completed"
          });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/onboarding"] });
        } catch (error) {
          console.error("Failed to mark onboarding as complete:", error);
        }
      }
    }
    
    if (type === "step:after") {
      setStepIndex(index + 1);
    }
  };

  const customStyles = {
    options: {
      primaryColor: "hsl(var(--pastoral-blue))",
      backgroundColor: "hsl(var(--background))",
      textColor: "hsl(var(--foreground))",
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: "8px",
      padding: "16px",
    },
    tooltipContent: {
      padding: "0",
    },
    buttonNext: {
      backgroundColor: "hsl(var(--pastoral-blue))",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "8px 16px",
      fontSize: "14px",
    },
    buttonBack: {
      color: "hsl(var(--muted-foreground))",
      marginRight: "8px",
    },
    buttonSkip: {
      color: "hsl(var(--muted-foreground))",
    },
  };

  if (!isRunning) return null;

  return (
    <Joyride
      steps={tourSteps}
      run={isRunning}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous
      showProgress
      showSkipButton
      styles={customStyles}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish Tour",
        next: "Next",
        skip: "Skip Tour",
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
}

interface OnboardingStarterProps {
  onStart: () => void;
}

export function OnboardingStarter({ onStart }: OnboardingStarterProps) {
  return (
    <div className="bg-gradient-to-r from-pastoral-blue/10 to-pastoral-green/10 p-4 rounded-lg border border-pastoral-blue/20 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg mb-1">New to the Admin Panel?</h3>
          <p className="text-muted-foreground text-sm">
            Take a quick tour to learn about all the powerful features available to manage your ministry platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onStart} 
            className="bg-pastoral-blue hover:bg-pastoral-blue/90"
            data-testid="button-start-tour"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Tour
          </Button>
        </div>
      </div>
    </div>
  );
}