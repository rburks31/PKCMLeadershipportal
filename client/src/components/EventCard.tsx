import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Phone, Mail, User } from "lucide-react";
import { ChurchEvent } from "@shared/schema";

interface EventCardProps {
  event: ChurchEvent;
  onRegister?: (eventId: number) => void;
  showRegistrationButton?: boolean;
}

export default function EventCard({ 
  event, 
  onRegister, 
  showRegistrationButton = true 
}: EventCardProps) {
  const formatDate = (date: Date | string) => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    const eventDate = new Date(date);
    return eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (startDate: Date | string, endDate?: Date | string) => {
    const start = formatDate(startDate);
    const startTime = formatTime(startDate);
    
    if (endDate) {
      const endTime = formatTime(endDate);
      const endDateFormatted = formatDate(endDate);
      
      if (start === endDateFormatted) {
        return `${start} • ${startTime} - ${endTime}`;
      } else {
        return `${start} ${startTime} - ${endDateFormatted} ${endTime}`;
      }
    }
    
    return `${start} • ${startTime}`;
  };

  const isRegistrationOpen = () => {
    if (!event.registrationRequired) return true;
    if (!event.registrationDeadline) return true;
    return new Date() <= new Date(event.registrationDeadline);
  };

  const isEventPast = () => {
    return new Date() > new Date(event.startDate);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'service': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'fellowship': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'prayer': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'conference': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'outreach': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Card 
      className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1" 
      data-testid={`card-event-${event.id}`}
    >
      {event.imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
            data-testid={`img-event-${event.id}`}
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle 
              className="text-xl font-bold text-foreground mb-2" 
              data-testid={`title-event-${event.id}`}
            >
              {event.title}
            </CardTitle>
            <Badge 
              className={`mb-2 ${getEventTypeColor(event.eventType || 'general')}`}
              data-testid={`badge-type-${event.id}`}
            >
              {event.eventType || 'General'}
            </Badge>
          </div>
        </div>
        
        {event.description && (
          <CardDescription 
            className="line-clamp-3 text-muted-foreground" 
            data-testid={`description-event-${event.id}`}
          >
            {event.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date and Time */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span data-testid={`date-event-${event.id}`}>
            {formatDateTime(event.startDate, event.endDate || undefined)}
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span data-testid={`location-event-${event.id}`}>{event.location}</span>
          </div>
        )}

        {/* Max Attendees */}
        {event.maxAttendees && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span data-testid={`max-attendees-${event.id}`}>
              Max {event.maxAttendees} attendees
            </span>
          </div>
        )}

        {/* Contact Information */}
        {(event.contactPerson || event.contactEmail || event.contactPhone) && (
          <div className="pt-2 border-t space-y-1">
            {event.contactPerson && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span data-testid={`contact-person-${event.id}`}>{event.contactPerson}</span>
              </div>
            )}
            {event.contactEmail && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span data-testid={`contact-email-${event.id}`}>{event.contactEmail}</span>
              </div>
            )}
            {event.contactPhone && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span data-testid={`contact-phone-${event.id}`}>{event.contactPhone}</span>
              </div>
            )}
          </div>
        )}

        {/* Registration Information */}
        {event.registrationRequired && event.registrationDeadline && (
          <div className="pt-2 border-t">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span data-testid={`registration-deadline-${event.id}`}>
                Registration deadline: {formatDateTime(event.registrationDeadline)}
              </span>
            </div>
          </div>
        )}

        {/* Registration Button */}
        {showRegistrationButton && event.registrationRequired && onRegister && (
          <div className="pt-3">
            <Button
              onClick={() => onRegister(event.id)}
              disabled={!isRegistrationOpen() || isEventPast()}
              className="w-full"
              data-testid={`button-register-${event.id}`}
            >
              {isEventPast() 
                ? "Event Passed" 
                : !isRegistrationOpen() 
                  ? "Registration Closed" 
                  : "Register for Event"
              }
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}