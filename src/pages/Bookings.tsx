import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar as CalendarIcon, Mail, Search, X } from "lucide-react";
import { toast } from "sonner";
import { EmailDialog } from "@/components/EmailDialog";
import { cn } from "@/lib/utils";

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || dateFrom || dateTo;

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Status filter
      if (statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }
      
      // Date range filter
      if (dateFrom || dateTo) {
        const bookingDate = new Date(booking.booking_date);
        if (dateFrom && bookingDate < dateFrom) {
          return false;
        }
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (bookingDate > endOfDay) {
            return false;
          }
        }
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const artistName = booking.artists?.name?.toLowerCase() || "";
        const clientName = booking.clients?.name?.toLowerCase() || "";
        const locationName = booking.locations?.name?.toLowerCase() || "";
        const venueName = booking.venues?.name?.toLowerCase() || "";
        const jobCode = booking.job_code?.toLowerCase() || "";
        
        return (
          artistName.includes(query) ||
          clientName.includes(query) ||
          locationName.includes(query) ||
          venueName.includes(query) ||
          jobCode.includes(query)
        );
      }
      
      return true;
    });
  }, [bookings, searchQuery, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          artists (name),
          clients (name),
          venues (name),
          locations (name)
        `)
        .order("booking_date", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch bookings");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): "enquiry" | "pencil" | "confirmed" | "cancelled" => {
    return status as "enquiry" | "pencil" | "confirmed" | "cancelled";
  };

  if (loading) {
    return <div className="text-center">Loading bookings...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage all your entertainment bookings</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/bookings/new")}>
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              Bookings ({filteredBookings.length}
              {filteredBookings.length !== bookings.length && ` of ${bookings.length}`})
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-56"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="enquiry">Enquiry</SelectItem>
                  <SelectItem value="pencil">Pencil</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-32 justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-32 justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No bookings yet</h3>
              <p className="mb-4 text-muted-foreground">Get started by creating your first booking</p>
              <Button onClick={() => navigate("/bookings/new")}>
                <Plus className="h-4 w-4" />
                Create Booking
              </Button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No matching bookings</h3>
              <p className="mb-4 text-muted-foreground">Try adjusting your search or filter criteria</p>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{booking.artists?.name || "No artist assigned"}</p>
                      <Badge variant={getStatusBadgeVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.clients?.name} • {booking.locations?.name || "No location"} • {booking.venues?.name || "No venue"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                      {booking.start_time && <span>{booking.start_time}</span>}
                      {booking.client_fee && (
                        <span className="font-medium text-foreground">
                          £{parseFloat(booking.client_fee).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(booking);
                        setEmailDialogOpen(true);
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Navigating to booking:", booking.id);
                        navigate(`/bookings/${booking.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBooking && (
        <EmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          booking={selectedBooking}
        />
      )}
    </div>
  );
}
