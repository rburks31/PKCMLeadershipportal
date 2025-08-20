import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminTooltipProps {
  title: string;
  description: string;
  feature?: string;
  position?: "top" | "bottom" | "left" | "right";
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function AdminTooltip({ 
  title, 
  description, 
  feature, 
  position = "top",
  children,
  showIcon = true
}: AdminTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2 cursor-help">
            {children}
            {showIcon && (
              <HelpCircle 
                className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`tooltip-icon-${feature}`}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={position} 
          className="max-w-xs p-3 bg-popover border shadow-lg"
          data-testid={`tooltip-content-${feature}`}
        >
          <div>
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}