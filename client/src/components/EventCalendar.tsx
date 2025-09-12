import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { ChurchEvent } from "@shared/schema";

interface EventCalendarProps {
  events: ChurchEvent[];
  onEventClick?: (event: ChurchEvent) => void;
}

export default function EventCalendar({ events, onEventClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    if (!date) return false;
    return date.getMonth() === currentDate.getMonth();
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'service': return 'bg-blue-500';
      case 'fellowship': return 'bg-green-500';
      case 'prayer': return 'bg-purple-500';
      case 'conference': return 'bg-orange-500';
      case 'outreach': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const calendarDays = getCalendarDays();

  return (
    <Card className="w-full" data-testid="calendar-events">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Calendar
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 
              className="text-lg font-semibold min-w-[140px] text-center"
              data-testid="text-current-month"
            >
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {daysOfWeek.map(day => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
              data-testid={`header-day-${day.toLowerCase()}`}
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dayEvents = date ? getEventsForDate(date) : [];
            
            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-1 border border-gray-200 dark:border-gray-700
                  ${!date ? 'bg-gray-50 dark:bg-gray-900' : ''}
                  ${isToday(date) ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-600' : ''}
                  ${!isCurrentMonth(date) && date ? 'text-muted-foreground bg-gray-50 dark:bg-gray-900' : ''}
                `}
                data-testid={`day-cell-${date ? date.getDate() : 'empty'}-${index}`}
              >
                {date && (
                  <>
                    <div className="text-sm font-medium mb-1">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event, eventIndex) => (
                        <div
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className={`
                            text-xs p-1 rounded cursor-pointer truncate
                            hover:opacity-80 transition-opacity
                            ${getEventTypeColor(event.eventType || 'general')} 
                            text-white
                          `}
                          title={event.title}
                          data-testid={`event-${event.id}-day-${date.getDate()}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Event Types:</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { type: 'service', label: 'Service' },
              { type: 'fellowship', label: 'Fellowship' },
              { type: 'prayer', label: 'Prayer' },
              { type: 'conference', label: 'Conference' },
              { type: 'outreach', label: 'Outreach' },
              { type: 'general', label: 'General' }
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center space-x-2">
                <div 
                  className={`w-3 h-3 rounded ${getEventTypeColor(type)}`}
                  data-testid={`legend-${type}`}
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}