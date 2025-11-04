import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit, ExternalLink } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameDay, isSameMonth, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ViewMode = "month" | "week" | "day";

interface Booking {
  id: string;
  start_date: string;
  start_time: string;
  finish_date: string;
  finish_time: string;
  status: string;
  artist_status: string;
  client_status: string;
  placeholder: boolean;
  artists: { name: string } | null;
  clients: { name: string } | null;
  locations: { name: string; id: string } | null;
  venues: { name: string } | null;
  sell_fee: number;
  buy_fee: number;
  notes: string;
}

export default function Diary() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentDate, viewMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          artists (id, name),
          clients (name),
          venues (name),
          locations (id, name)
        `)
        .order("start_date", { ascending: true });

      if (bookingsError) throw bookingsError;

      // Fetch all locations
      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("id, name")
        .order("name");

      if (locationsError) throw locationsError;

      // Fetch all artists
      const { data: artistsData, error: artistsError } = await supabase
        .from("artists")
        .select("id, name")
        .order("name");

      if (artistsError) throw artistsError;

      setBookings(bookingsData || []);
      setLocations(locationsData || []);
      setArtists(artistsData || []);
    } catch (error: any) {
      toast.error("Failed to fetch data");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return { start, end };
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return { start, end };
    } else {
      return { start: currentDate, end: currentDate };
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, direction === "next" ? 1 : -1));
    } else {
      setCurrentDate(addDays(currentDate, direction === "next" ? 1 : -1));
    }
  };

  const getStatusColor = (status: string, placeholder: boolean) => {
    if (placeholder) return "bg-destructive/20 border-destructive text-destructive";
    switch (status) {
      case "confirmed":
        return "bg-success/20 border-success text-success";
      case "pencil":
        return "bg-warning/20 border-warning text-warning";
      case "cancelled":
        return "bg-muted border-muted-foreground text-muted-foreground line-through";
      default:
        return "bg-secondary border-border text-secondary-foreground";
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = parseISO(booking.start_date);
      return isSameDay(bookingDate, date);
    });
  };

  const renderMonthView = () => {
    const { start, end } = getDateRange();
    const days = [];
    let day = start;

    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-2 flex-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
          <div key={dayName} className="p-2 text-center font-semibold text-sm text-muted-foreground">
            {dayName}
          </div>
        ))}
        {days.map((day, idx) => {
          const dayBookings = getBookingsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div
              key={idx}
              className={cn(
                "min-h-[120px] border rounded-lg p-2 overflow-auto",
                !isCurrentMonth && "bg-muted/50"
              )}
            >
              <div className={cn("text-sm font-medium mb-1", !isCurrentMonth && "text-muted-foreground")}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayBookings.map((booking) => (
                  <TooltipProvider key={booking.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => setSelectedBooking(booking)}
                          className={cn(
                            "text-xs p-1 rounded border cursor-pointer hover:opacity-80 transition-opacity",
                            getStatusColor(booking.artist_status || booking.status, booking.placeholder)
                          )}
                        >
                          <div className="font-medium truncate">
                            {booking.artists?.name || "TBA"}
                          </div>
                          <div className="truncate text-[10px]">
                            @ {booking.locations?.name}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <div className="space-y-1">
                          <div className="font-bold">{booking.artists?.name || "TBA"} @ {booking.locations?.name}</div>
                          <div>Client: {booking.clients?.name}</div>
                          {booking.venues && <div>Venue: {booking.venues.name}</div>}
                          <div>Time: {booking.start_time} - {booking.finish_time}</div>
                          <div>Status: {booking.artist_status || booking.status}</div>
                          {booking.sell_fee && <div>Fee: £{booking.sell_fee}</div>}
                          {booking.notes && <div className="text-muted-foreground text-xs">{booking.notes}</div>}
                          <div className="text-xs text-primary mt-2">Click to view details</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const { start, end } = getDateRange();
    const days = [];
    let day = start;

    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="flex flex-col gap-4 flex-1">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const dayBookings = getBookingsForDate(day);
            
            return (
              <div key={idx} className="flex flex-col">
                <div className="p-2 text-center font-semibold border-b">
                  <div className="text-sm">{format(day, "EEE")}</div>
                  <div className="text-lg">{format(day, "d")}</div>
                </div>
                <div className="flex-1 border rounded-b-lg p-2 min-h-[300px] space-y-2 overflow-auto">
                  {dayBookings.map((booking) => (
                    <TooltipProvider key={booking.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => setSelectedBooking(booking)}
                            className={cn(
                              "text-sm p-2 rounded border cursor-pointer hover:opacity-80 transition-opacity",
                              getStatusColor(booking.artist_status || booking.status, booking.placeholder)
                            )}
                          >
                            <div className="font-medium">{booking.artists?.name || "TBA"}</div>
                            <div className="text-xs">@ {booking.locations?.name}</div>
                            <div className="text-xs">{booking.start_time}</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <div className="space-y-1">
                            <div className="font-bold">{booking.artists?.name || "TBA"} @ {booking.locations?.name}</div>
                            <div>Client: {booking.clients?.name}</div>
                            {booking.venues && <div>Venue: {booking.venues.name}</div>}
                            <div>Time: {booking.start_time} - {booking.finish_time}</div>
                            <div>Status: {booking.artist_status || booking.status}</div>
                            {booking.sell_fee && <div>Fee: £{booking.sell_fee}</div>}
                            {booking.notes && <div className="text-muted-foreground text-xs">{booking.notes}</div>}
                            <div className="text-xs text-primary mt-2">Click to view details</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate);
    
    // Group by location and show all locations
    const bookingsByLocation = locations.map((location) => ({
      location,
      bookings: dayBookings.filter((b) => b.locations?.id === location.id),
    }));

    return (
      <div className="flex-1 overflow-auto">
        <div className="space-y-4">
          {bookingsByLocation.map(({ location, bookings: locationBookings }) => (
            <Card key={location.id}>
              <CardHeader>
                <CardTitle className="text-lg">{location.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {locationBookings.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-destructive/50 rounded-lg bg-destructive/10 text-center text-destructive font-semibold">
                    🔴 No bookings - Available slot
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locationBookings.map((booking) => (
                      <TooltipProvider key={booking.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => setSelectedBooking(booking)}
                              className={cn(
                                "p-3 rounded-lg border-2 cursor-pointer hover:opacity-80 transition-opacity",
                                getStatusColor(booking.artist_status || booking.status, booking.placeholder)
                              )}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold">{booking.artists?.name || "TBA"} @ {location.name}</div>
                                  <div className="text-sm">{booking.clients?.name}</div>
                                  <div className="text-sm">{booking.start_time} - {booking.finish_time}</div>
                                </div>
                                <Badge variant="outline">{booking.artist_status || booking.status}</Badge>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <div className="space-y-1">
                              <div className="font-bold">{booking.artists?.name || "TBA"} @ {booking.locations?.name}</div>
                              <div>Client: {booking.clients?.name}</div>
                              {booking.venues && <div>Venue: {booking.venues.name}</div>}
                              <div>Time: {booking.start_time} - {booking.finish_time}</div>
                              <div>Status: {booking.artist_status || booking.status}</div>
                              {booking.sell_fee && <div>Fee: £{booking.sell_fee}</div>}
                              {booking.notes && <div className="text-muted-foreground text-xs">{booking.notes}</div>}
                              <div className="text-xs text-primary mt-2">Click to view details</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading diary...</div>;
  }

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar */}
      {showSidebar && (
        <Card className="w-80 flex-shrink-0 overflow-auto">
          <CardHeader>
            <CardTitle className="text-lg">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* View Mode Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">View Mode</label>
              <div className="flex flex-col gap-2">
                <Button 
                  variant={viewMode === "month" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setViewMode("month")}
                  className="w-full justify-start"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Month View
                </Button>
                <Button 
                  variant={viewMode === "week" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setViewMode("week")}
                  className="w-full justify-start"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Week View
                </Button>
                <Button 
                  variant={viewMode === "day" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setViewMode("day")}
                  className="w-full justify-start"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Day View
                </Button>
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Jump to Date</label>
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                className="rounded-md border"
              />
            </div>

            {/* Quick Navigation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Jump</label>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Legend</label>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success/20 border border-success"></div>
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-warning/20 border border-warning"></div>
                  <span>Pencilled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted border border-muted-foreground line-through"></div>
                  <span>Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive"></div>
                  <span>Unbooked Slot</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium">Statistics</label>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Bookings:</span>
                  <span className="font-medium">{bookings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Locations:</span>
                  <span className="font-medium">{locations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Artists:</span>
                  <span className="font-medium">{artists.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Diary</h1>
            <p className="text-muted-foreground">Booking calendar and schedule overview</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? "Hide" : "Show"} Sidebar
          </Button>
        </div>

        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <CardTitle>
                  {viewMode === "month" && format(currentDate, "MMMM yyyy")}
                  {viewMode === "week" && `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`}
                  {viewMode === "day" && format(currentDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </div>
              <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-auto">
            {viewMode === "month" && renderMonthView()}
            {viewMode === "week" && renderWeekView()}
            {viewMode === "day" && renderDayView()}
          </CardContent>
        </Card>
      </div>

      {/* Booking Details Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Booking Details
            </DialogTitle>
            <DialogDescription>
              View and manage booking information
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Artist</label>
                  <p className="font-semibold">{selectedBooking.artists?.name || "TBA"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div>
                    <Badge className={cn(getStatusColor(selectedBooking.artist_status || selectedBooking.status, selectedBooking.placeholder))}>
                      {selectedBooking.artist_status || selectedBooking.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client</label>
                  <p>{selectedBooking.clients?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p>{selectedBooking.locations?.name}</p>
                </div>
                {selectedBooking.venues && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Venue</label>
                    <p>{selectedBooking.venues.name}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p>{format(parseISO(selectedBooking.start_date), "EEEE, MMMM d, yyyy")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time</label>
                  <p>{selectedBooking.start_time} - {selectedBooking.finish_time}</p>
                </div>
                {selectedBooking.sell_fee && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fee</label>
                    <p className="font-semibold">£{selectedBooking.sell_fee}</p>
                  </div>
                )}
              </div>
              
              {selectedBooking.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm mt-1">{selectedBooking.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => {
                    navigate(`/bookings/${selectedBooking.id}`);
                    setSelectedBooking(null);
                  }}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Full Details
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
