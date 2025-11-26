import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ChevronLeft, ChevronRight, Edit, Eye } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, addMonths, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface Booking {
  id: string;
  start_date: string;
  start_time: string;
  finish_date: string;
  finish_time: string;
  arrival_time?: string;
  status: string;
  artist_status: string;
  client_status: string;
  placeholder: boolean;
  artists: { id: string; name: string } | null;
  clients: { name: string } | null;
  locations: { name: string; id: string } | null;
  venues: { name: string } | null;
  sell_fee: number;
  buy_fee: number;
  notes: string;
  profit_percent: number;
}

interface Location {
  id: string;
  name: string;
}

interface Artist {
  id: string;
  name: string;
}

export default function Diary() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState("month");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
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

      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("id, name")
        .order("name");

      if (locationsError) throw locationsError;

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

  const getStatusColor = (status: string, placeholder: boolean) => {
    if (placeholder) return { 
      bg: "bg-destructive", 
      text: "text-destructive-foreground", 
      border: "border-destructive",
      bold: "font-bold"
    };
    switch (status) {
      case "confirmed":
        return { 
          bg: "bg-success", 
          text: "text-success-foreground", 
          border: "border-success",
          bold: ""
        };
      case "pencil":
        return { 
          bg: "bg-warning", 
          text: "text-warning-foreground", 
          border: "border-warning",
          bold: ""
        };
      case "cancelled":
        return { 
          bg: "bg-muted", 
          text: "text-muted-foreground", 
          border: "border-muted-foreground",
          bold: ""
        };
      default:
        return { 
          bg: "bg-secondary", 
          text: "text-secondary-foreground", 
          border: "border-border",
          bold: ""
        };
    }
  };

  const renderBookingHoverContent = (booking: Booking) => (
    <div className="space-y-3 min-w-[280px]">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Artist</label>
          <p className="text-sm font-semibold">{booking.artists?.name || "TBA"}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Client</label>
          <p className="text-sm font-semibold">{booking.clients?.name}</p>
        </div>
      </div>
      
      <div>
        <label className="text-xs font-medium text-muted-foreground">Location</label>
        <p className="text-sm font-semibold">{booking.locations?.name}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {booking.arrival_time && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Arrival</label>
            <p className="text-sm">{booking.arrival_time}</p>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Start</label>
          <p className="text-sm">{booking.start_time}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Finish</label>
          <p className="text-sm">{booking.finish_time}</p>
        </div>
      </div>

      {(booking.sell_fee || booking.buy_fee) && (
        <div className="grid grid-cols-3 gap-2">
          {booking.sell_fee && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Sell</label>
              <p className="text-sm font-semibold">£{booking.sell_fee.toFixed(2)}</p>
            </div>
          )}
          {booking.buy_fee && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Buy</label>
              <p className="text-sm font-semibold">£{booking.buy_fee.toFixed(2)}</p>
            </div>
          )}
          {booking.profit_percent && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Profit</label>
              <p className="text-sm font-semibold">{booking.profit_percent}%</p>
            </div>
          )}
        </div>
      )}

      {booking.notes && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <p className="text-xs bg-muted p-2 rounded">{booking.notes}</p>
        </div>
      )}
    </div>
  );

  const getCalendarEvents = () => {
    return bookings.map((booking) => {
      const colors = getStatusColor(booking.artist_status || booking.status, booking.placeholder);
      
      // Map Tailwind classes to CSS custom property colors
      const colorMap: Record<string, string> = {
        'bg-success': 'hsl(var(--success))',
        'bg-warning': 'hsl(var(--warning))',
        'bg-destructive': 'hsl(var(--destructive))',
        'bg-muted': 'hsl(var(--muted))',
        'bg-secondary': 'hsl(var(--secondary))',
      };
      
      const textColorMap: Record<string, string> = {
        'text-success-foreground': 'hsl(var(--success-foreground))',
        'text-warning-foreground': 'hsl(var(--warning-foreground))',
        'text-destructive-foreground': 'hsl(var(--destructive-foreground))',
        'text-muted-foreground': 'hsl(var(--muted-foreground))',
        'text-secondary-foreground': 'hsl(var(--secondary-foreground))',
      };
      
      const startTime = booking.start_time || '09:00';
      const endTime = booking.finish_time || '17:00';
      const endDate = booking.finish_date || booking.start_date;
      
      return {
        id: booking.id,
        title: `${booking.artists?.name || "TBA"} @ ${booking.locations?.name || "TBA"}`,
        start: `${booking.start_date}T${startTime}`,
        end: `${endDate}T${endTime}`,
        backgroundColor: colorMap[colors.bg] || 'hsl(var(--primary))',
        borderColor: colorMap[colors.bg] || 'hsl(var(--primary))',
        textColor: textColorMap[colors.text] || 'hsl(var(--primary-foreground))',
        extendedProps: {
          booking
        }
      };
    });
  };

  const handleEventClick = (info: any) => {
    setSelectedBooking(info.event.extendedProps.booking);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(addMonths(currentDate, direction === "next" ? 1 : -1));
  };

  const renderGridView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = [];
    let day = start;

    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 sticky left-0 bg-muted z-10 min-w-[150px]">Artist / Location</th>
              {days.map((d) => (
                <th key={d.toISOString()} className="border p-2 min-w-[100px]">
                  <div className="text-xs">{format(d, "EEE")}</div>
                  <div className="font-bold">{format(d, "d")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Render row for unassigned bookings (no artist) */}
            <tr className="hover:bg-muted/50 bg-warning/10">
              <td className="border p-2 font-medium sticky left-0 bg-warning/20 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-warning"></div>
                  <span className="font-bold text-warning-foreground">Unassigned</span>
                </div>
              </td>
              {days.map((day) => {
                const dayBookings = bookings.filter(
                  (b) => !b.artists && isSameDay(parseISO(b.start_date), day)
                );
                const hasBooking = dayBookings.length > 0;

                return (
                  <td key={day.toISOString()} className="border p-1 bg-warning/5">
                    {hasBooking ? (
                      <div className="space-y-1">
                        {dayBookings.map((booking) => {
                          const colors = getStatusColor(booking.artist_status || booking.status, booking.placeholder);
                          return (
                            <HoverCard key={booking.id} openDelay={200}>
                              <HoverCardTrigger asChild>
                                <div
                                  onClick={() => setSelectedBooking(booking)}
                                  className={cn(
                                    "p-1 rounded cursor-pointer hover:opacity-80 transition-opacity text-[10px]",
                                    "bg-warning text-warning-foreground",
                                    booking.artist_status === "cancelled" && "line-through"
                                  )}
                                >
                                  <div className="font-bold truncate">{booking.locations?.name || "No Location"}</div>
                                  <div>{booking.start_time || "TBA"}</div>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-auto" side="right">
                                {renderBookingHoverContent(booking)}
                              </HoverCardContent>
                            </HoverCard>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full min-h-[40px] flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">—</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Render rows for each artist */}
            {artists.map((artist) => (
              <tr key={`artist-${artist.id}`} className="hover:bg-muted/50">
                <td className="border p-2 font-medium sticky left-0 bg-background z-10">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    {artist.name}
                  </div>
                </td>
                {days.map((day) => {
                  const dayBookings = bookings.filter(
                    (b) => b.artists?.id === artist.id && isSameDay(parseISO(b.start_date), day)
                  );
                  const hasBooking = dayBookings.length > 0;

                  return (
                    <td key={day.toISOString()} className="border p-1">
                      {hasBooking ? (
                        <div className="space-y-1">
                          {dayBookings.map((booking) => {
                            const colors = getStatusColor(booking.artist_status || booking.status, booking.placeholder);
                            return (
                              <HoverCard key={booking.id} openDelay={200}>
                                <HoverCardTrigger asChild>
                                  <div
                                    onClick={() => setSelectedBooking(booking)}
                                    className={cn(
                                      "p-1 rounded cursor-pointer hover:opacity-80 transition-opacity text-[10px]",
                                      colors.bg,
                                      colors.text,
                                      colors.bold,
                                      booking.artist_status === "cancelled" && "line-through"
                                    )}
                                  >
                                    <div className="font-bold truncate">{booking.locations?.name}</div>
                                    <div>{booking.start_time}</div>
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-auto" side="right">
                                  {renderBookingHoverContent(booking)}
                                </HoverCardContent>
                              </HoverCard>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full min-h-[40px] flex items-center justify-center">
                          <span className="text-muted-foreground text-xs">—</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Separator row */}
            <tr>
              <td colSpan={days.length + 1} className="h-4 bg-muted"></td>
            </tr>

            {/* Render rows for each location */}
            {locations.map((location) => (
              <tr key={`location-${location.id}`} className="hover:bg-muted/50">
                <td className="border p-2 font-medium sticky left-0 bg-background z-10">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-secondary"></div>
                    {location.name}
                  </div>
                </td>
                {days.map((day) => {
                  const dayBookings = bookings.filter(
                    (b) => b.locations?.id === location.id && isSameDay(parseISO(b.start_date), day)
                  );
                  const hasBooking = dayBookings.length > 0;

                  return (
                    <td key={day.toISOString()} className="border p-1">
                      {hasBooking ? (
                        <div className="space-y-1">
                          {dayBookings.map((booking) => {
                            const colors = getStatusColor(booking.artist_status || booking.status, booking.placeholder);
                            return (
                              <HoverCard key={booking.id} openDelay={200}>
                                <HoverCardTrigger asChild>
                                  <div
                                    onClick={() => setSelectedBooking(booking)}
                                    className={cn(
                                      "p-1 rounded cursor-pointer hover:opacity-80 transition-opacity text-[10px]",
                                      colors.bg,
                                      colors.text,
                                      colors.bold,
                                      booking.artist_status === "cancelled" && "line-through"
                                    )}
                                  >
                                    <div className="font-bold truncate">{booking.artists?.name || "TBA"}</div>
                                    <div>{booking.start_time}</div>
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-auto" side="right">
                                  {renderBookingHoverContent(booking)}
                                </HoverCardContent>
                              </HoverCard>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full min-h-[40px] flex items-center justify-center bg-destructive/10">
                          <span className="text-destructive font-bold text-xs">🔴</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading diary...</div>;
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Diary</h1>
          <p className="text-muted-foreground">Manage your bookings calendar</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold min-w-[150px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning"></div>
              <span>Pencilled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted line-through"></div>
              <span>Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive"></div>
              <span>Placeholder</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-destructive font-bold text-lg">🔴</span>
              <span>Unbooked slot (available)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="month">Month Calendar</TabsTrigger>
          <TabsTrigger value="week">Week Calendar</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="flex-1 mt-4">
          <Card className="h-full">
            <CardContent className="pt-6 h-full">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={getCalendarEvents()}
                eventClick={handleEventClick}
                headerToolbar={false}
                height="100%"
                eventDisplay="block"
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="flex-1 mt-4">
          <Card className="h-full">
            <CardContent className="pt-6 h-full">
              <FullCalendar
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                events={getCalendarEvents()}
                eventClick={handleEventClick}
                headerToolbar={false}
                height="100%"
                slotMinTime="08:00:00"
                slotMaxTime="24:00:00"
                allDaySlot={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid" className="flex-1 mt-4">
          <Card className="h-full overflow-auto">
            <CardContent className="pt-6">
              {renderGridView()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Artist</label>
                  <p className="text-lg font-semibold">{selectedBooking.artists?.name || "TBA"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client</label>
                  <p className="text-lg font-semibold">{selectedBooking.clients?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-lg font-semibold">{selectedBooking.locations?.name}</p>
                </div>
                {selectedBooking.venues && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Venue</label>
                    <p className="text-lg font-semibold">{selectedBooking.venues.name}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p>{format(parseISO(selectedBooking.start_date), "PPP")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={cn(getStatusColor(selectedBooking.artist_status || selectedBooking.status, selectedBooking.placeholder).bg)}>
                    {selectedBooking.artist_status || selectedBooking.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {selectedBooking.arrival_time && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Arrival</label>
                    <p>{selectedBooking.arrival_time}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start</label>
                  <p>{selectedBooking.start_time}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Finish</label>
                  <p>{selectedBooking.finish_time}</p>
                </div>
              </div>

              {(selectedBooking.sell_fee || selectedBooking.buy_fee) && (
                <div className="grid grid-cols-3 gap-4">
                  {selectedBooking.sell_fee && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sell Fee</label>
                      <p className="text-lg font-semibold">£{selectedBooking.sell_fee.toFixed(2)}</p>
                    </div>
                  )}
                  {selectedBooking.buy_fee && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Buy Fee</label>
                      <p className="text-lg font-semibold">£{selectedBooking.buy_fee.toFixed(2)}</p>
                    </div>
                  )}
                  {selectedBooking.profit_percent && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Profit</label>
                      <p className="text-lg font-semibold">{selectedBooking.profit_percent}%</p>
                    </div>
                  )}
                </div>
              )}

              {selectedBooking.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedBooking.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => navigate(`/bookings/${selectedBooking.id}`)} className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Details
                </Button>
                <Button variant="outline" onClick={() => navigate(`/bookings/${selectedBooking.id}`)} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
