import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { X, Play, SkipForward, ArrowRight, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const tourSteps = [
  {
    target: '[data-testid="admin-dashboard-overview"]',
    title: "Welcome to the Admin Dashboard!",
    content: "This overview shows key metrics about your ministry platform including student enrollment, course completion rates, and recent activity.",
    placement: "bottom",
  },
  {
    target: '[data-testid="admin-nav-users"]',
    title: "User Management",
    content: "Manage all users in your system - students, instructors, and admins. You can view profiles, update roles, and track activity.",
    placement: "right",
  },
  {
    target: '[data-testid="admin-nav-courses"]',
    title: "Course Management",
    content: "Create, edit, and organize your ministry courses. Set up modules, lessons, and track student progress through your discipleship programs.",
    placement: "right",
  },
  {
    target: '[data-testid="admin-nav-discussions"]',
    title: "Discussion Management", 
    content: "Moderate course discussions, encourage community interaction, and ensure healthy biblical dialogue among students.",
    placement: "right",
  },
  {
    target: '[data-testid="admin-quick-actions"]',
    title: "Quick Actions",
    content: "Access frequently used admin functions quickly. Create courses, add users, send announcements, and more with just one click.",
    placement: "bottom",
  },
  {
    target: '[data-testid="admin-activity-feed"]',
    title: "Real-time Activity Feed",
    content: "Stay updated with live activity across your platform. See new enrollments, course completions, and user interactions as they happen.",
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
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  useEffect(() => {
    console.log("Custom tour isOpen changed:", isOpen);
    
    if (isOpen && stepIndex < tourSteps.length) {
      // Add delay to ensure elements are rendered
      const attemptHighlight = (retryCount = 0) => {
        const targetSelector = tourSteps[stepIndex].target;
        const element = document.querySelector(targetSelector);
        console.log(`Highlighting element for step ${stepIndex}:`, targetSelector, !!element, `(attempt ${retryCount + 1})`);
        
        if (element) {
          setHighlightedElement(element);
          
          // Add highlight styles
          element.classList.add('tour-highlight');
          
          // Scroll into view
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
          
          // Add CSS for highlighting
          if (!document.querySelector('#tour-styles')) {
            const style = document.createElement('style');
            style.id = 'tour-styles';
            style.textContent = `
              .tour-highlight {
                outline: 4px solid #3b82f6 !important;
                outline-offset: 4px !important;
                border-radius: 8px !important;
                position: relative !important;
                z-index: 1000 !important;
                background-color: rgba(59, 130, 246, 0.1) !important;
                box-shadow: 0 0 20px rgba(59, 130, 246, 0.3) !important;
              }
              .tour-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.4);
                z-index: 999;
                pointer-events: none;
              }
            `;
            document.head.appendChild(style);
          }
        } else if (retryCount < 5) {
          // Retry after a short delay if element not found
          setTimeout(() => attemptHighlight(retryCount + 1), 200);
        } else {
          console.warn(`Could not find element: ${targetSelector} after 5 attempts`);
        }
      };

      // Start highlighting attempt with initial delay
      setTimeout(() => attemptHighlight(), 100);
    }
    
    return () => {
      // Clean up highlights
      if (highlightedElement) {
        highlightedElement.classList.remove('tour-highlight');
      }
    };
  }, [isOpen, stepIndex]);

  const handleNext = () => {
    if (stepIndex < tourSteps.length - 1) {
      // Remove current highlight
      if (highlightedElement) {
        highlightedElement.classList.remove('tour-highlight');
      }
      setStepIndex(stepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      // Remove current highlight
      if (highlightedElement) {
        highlightedElement.classList.remove('tour-highlight');
      }
      setStepIndex(stepIndex - 1);
    }
  };

  const handleFinish = async () => {
    console.log("Tour finished");
    
    // Clean up highlights
    if (highlightedElement) {
      highlightedElement.classList.remove('tour-highlight');
    }
    
    // Remove styles
    const tourStyles = document.querySelector('#tour-styles');
    if (tourStyles) {
      tourStyles.remove();
    }
    
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
  };

  const currentStep = tourSteps[stepIndex];

  if (!isOpen || !currentStep) {
    return null;
  }

  return (
    <>
      <div className="tour-overlay" />
      <Dialog open={isOpen} onOpenChange={() => handleFinish()}>
        <DialogContent className="sm:max-w-md z-[1001]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {currentStep.title}
              <span className="text-sm text-muted-foreground">
                {stepIndex + 1} / {tourSteps.length}
              </span>
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-sm">
            {currentStep.content}
          </DialogDescription>
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={stepIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-pastoral-blue hover:bg-pastoral-blue/90"
              >
                {stepIndex === tourSteps.length - 1 ? (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Finish Tour
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFinish}
              className="text-muted-foreground"
            >
              Skip Tour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface OnboardingStarterProps {
  onStart: () => void;
}

export function OnboardingStarter({ onStart }: OnboardingStarterProps) {
  const handleStartTour = () => {
    console.log("Start Tour button clicked!"); // Debug log
    onStart();
  };

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
            onClick={handleStartTour} 
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