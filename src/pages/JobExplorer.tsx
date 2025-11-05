import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Filter, FileText, Eye, Calendar, MapPin, User } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  status: string;
  artist_status: string;
  client_status: string;
  client_fee: number;
  artist_fee: number;
  invoice_status: string;
  notes: string;
  artist_id: string | null;
  location_id: string | null;
  artists: { name: string } | null;
  clients: { name: string } | null;
  locations: { name: string } | null;
  venues: { name: string } | null;
}

export default function JobExplorer() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Filter options
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  // Sorting
  const [sortColumn, setSortColumn] = useState<keyof Booking>("booking_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchQuery, selectedArtist, selectedLocation, selectedStatus, dateFrom, dateTo, sortColumn, sortDirection]);

  const fetchData = async () => {
    try {
      const [bookingsRes, artistsRes, locationsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(`
            *,
            artists (name),
            clients (name),
            locations (name),
            venues (name)
          `)
          .order("booking_date", { ascending: false }),
        supabase.from("artists").select("id, name").order("name"),
        supabase.from("locations").select("id, name").order("name"),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (artistsRes.error) throw artistsRes.error;
      if (locationsRes.error) throw locationsRes.error;

      setBookings(bookingsRes.data || []);
      setArtists(artistsRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.artists?.name?.toLowerCase().includes(query) ||
          booking.clients?.name?.toLowerCase().includes(query) ||
          booking.locations?.name?.toLowerCase().includes(query) ||
          booking.venues?.name?.toLowerCase().includes(query) ||
          booking.notes?.toLowerCase().includes(query)
      );
    }

    // Artist filter
    if (selectedArtist !== "all") {
      filtered = filtered.filter((booking) => booking.artist_id === selectedArtist);
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter((booking) => booking.location_id === selectedLocation);
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((booking) => booking.status === selectedStatus);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((booking) => booking.booking_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((booking) => booking.booking_date <= dateTo);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle nested objects
      if (sortColumn === "artists" || sortColumn === "clients" || sortColumn === "locations") {
        aVal = a[sortColumn]?.name || "";
        bVal = b[sortColumn]?.name || "";
      }

      if (aVal === null || aVal === undefined) aVal = "";
      if (bVal === null || bVal === undefined) bVal = "";

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredBookings(filtered);
  };

  const handleSort = (column: keyof Booking) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleGenerateInvoice = async (booking: Booking) => {
    try {
      // Check if invoice already exists
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("booking_id", booking.id)
        .maybeSingle();

      if (existingInvoice) {
        toast.error("Invoice already exists for this booking");
        return;
      }

      // Calculate due date (30 days from booking date)
      const dueDate = new Date(booking.booking_date);
      dueDate.setDate(dueDate.getDate() + 30);

      const { error } = await supabase.from("invoices").insert({
        booking_id: booking.id,
        amount_due: booking.client_fee,
        due_date: dueDate.toISOString().split("T")[0],
        status: "unpaid",
      });

      if (error) throw error;

      // Update booking invoice status
      await supabase
        .from("bookings")
        .update({ invoice_status: "sent" })
        .eq("id", booking.id);

      toast.success("Invoice generated successfully");
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const getStatusBadgeVariant = (status: string): "enquiry" | "pencil" | "confirmed" | "cancelled" => {
    return status as "enquiry" | "pencil" | "confirmed" | "cancelled";
  };

  const uninvoicedBookings = filteredBookings.filter(
    (booking) => booking.invoice_status === "uninvoiced" || !booking.invoice_status
  );

  const BookingsTable = ({ bookings }: { bookings: Booking[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort("booking_date")}>
              Date {sortColumn === "booking_date" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("artists" as keyof Booking)}>
              Artist {sortColumn === "artists" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("clients" as keyof Booking)}>
              Client {sortColumn === "clients" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("locations" as keyof Booking)}>
              Location {sortColumn === "locations" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("client_fee")}>
              Fee {sortColumn === "client_fee" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No bookings found
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => (
              <TableRow key={booking.id} className="hover:bg-secondary/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(booking.booking_date), "dd MMM yyyy")}
                    {booking.start_time && (
                      <span className="text-xs text-muted-foreground">{booking.start_time}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {booking.artists?.name || "No artist"}
                  </div>
                </TableCell>
                <TableCell>{booking.clients?.name || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {booking.locations?.name || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {booking.client_fee ? `£${parseFloat(booking.client_fee.toString()).toFixed(2)}` : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={booking.invoice_status === "uninvoiced" ? "destructive" : "default"}>
                    {booking.invoice_status || "uninvoiced"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {(booking.invoice_status === "uninvoiced" || !booking.invoice_status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateInvoice(booking)}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Invoice
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job Explorer</h1>
        <p className="text-muted-foreground">Search and filter all bookings with advanced options</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          <CardDescription>Use filters to find specific bookings quickly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by artist, client, location, venue, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Artist</Label>
              <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Artists</SelectItem>
                  {artists.map((artist) => (
                    <SelectItem key={artist.id} value={artist.id}>
                      {artist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="enquiry">Enquiry</SelectItem>
                  <SelectItem value="pencil">Pencilled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedArtist("all");
                setSelectedLocation("all");
                setSelectedStatus("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Bookings ({filteredBookings.length})
          </TabsTrigger>
          <TabsTrigger value="uninvoiced">
            Uninvoiced ({uninvoicedBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>Complete list of filtered bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingsTable bookings={filteredBookings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uninvoiced">
          <Card>
            <CardHeader>
              <CardTitle>Uninvoiced Bookings</CardTitle>
              <CardDescription>
                Bookings that need invoices generated - grouped by client and date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingsTable bookings={uninvoicedBookings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
