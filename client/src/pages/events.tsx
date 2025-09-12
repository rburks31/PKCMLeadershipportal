import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Grid, Search, Filter, Plus } from "lucide-react";
import EventCard from "@/components/EventCard";
import EventCalendar from "@/components/EventCalendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ChurchEvent } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch church events
  const { data: events = [], isLoading } = useQuery<ChurchEvent[]>({
    queryKey: ["/api/events"],
  });

  // Register for event mutation
  const registerMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return await apiRequest(`/api/events/${eventId}/register`, "POST", {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully registered for the event!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for event",
        variant: "destructive",
      });
    },
  });

  // Helper function to format date
  const formatDate = (date: Date | string) => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter events based on search term and event type
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedEventType === "all" || event.eventType === selectedEventType;
    return matchesSearch && matchesType;
  });

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = filteredEvents.filter(event => new Date(event.startDate) > now);
  const pastEvents = filteredEvents.filter(event => new Date(event.startDate) <= now);

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(events.map(event => event.eventType || 'general')));

  const handleRegister = (eventId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to register for events",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(eventId);
  };

  const handleEventClick = (event: ChurchEvent) => {
    // You can add navigation to event details page here
    console.log("Event clicked:", event);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4" data-testid="title-events-page">
            Church Events
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto" data-testid="description-events-page">
            Join us for worship, fellowship, and community events throughout the year
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-events"
                />
              </div>

              {/* Event Type Filter */}
              <div className="w-full md:w-48">
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger data-testid="select-event-type">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {eventTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-4 text-sm text-muted-foreground" data-testid="text-results-summary">
              {filteredEvents.length === 0 ? (
                "No events found"
              ) : (
                `Found ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="grid" className="flex items-center gap-2" data-testid="tab-grid-view">
              <Grid className="h-4 w-4" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2" data-testid="tab-calendar-view">
              <Calendar className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          {/* Grid View */}
          <TabsContent value="grid" className="space-y-8">
            {/* Upcoming Events */}
            <section>
              <h2 className="text-2xl font-bold mb-6" data-testid="title-upcoming-events">
                Upcoming Events ({upcomingEvents.length})
              </h2>
              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRegister={handleRegister}
                      showRegistrationButton={true}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">No Upcoming Events</p>
                    <p className="text-muted-foreground">
                      {searchTerm || selectedEventType !== "all" 
                        ? "Try adjusting your search or filter criteria"
                        : "Check back soon for new events"
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6" data-testid="title-past-events">
                  Past Events ({pastEvents.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.slice(0, 6).map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      showRegistrationButton={false}
                    />
                  ))}
                </div>
                {pastEvents.length > 6 && (
                  <div className="text-center mt-6">
                    <Button variant="outline">
                      View All Past Events ({pastEvents.length - 6} more)
                    </Button>
                  </div>
                )}
              </section>
            )}
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-8">
            <EventCalendar 
              events={filteredEvents} 
              onEventClick={handleEventClick}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}