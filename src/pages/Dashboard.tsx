import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, MapPin, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalBookings: number;
  confirmedBookings: number;
  totalArtists: number;
  totalVenues: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    confirmedBookings: 0,
    totalArtists: 0,
    totalVenues: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch booking stats
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("status");

      if (bookingsError) throw bookingsError;

      const confirmedCount = bookings?.filter((b) => b.status === "confirmed").length || 0;

      // Fetch artist count
      const { count: artistCount, error: artistError } = await supabase
        .from("artists")
        .select("*", { count: "exact", head: true });

      if (artistError) throw artistError;

      // Fetch venue count
      const { count: venueCount, error: venueError } = await supabase
        .from("venues")
        .select("*", { count: "exact", head: true });

      if (venueError) throw venueError;

      // Fetch recent bookings
      const { data: recent, error: recentError } = await supabase
        .from("bookings")
        .select(`
          *,
          artists (name),
          clients (name),
          venues (name),
          parks (name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      setStats({
        totalBookings: bookings?.length || 0,
        confirmedBookings: confirmedCount,
        totalArtists: artistCount || 0,
        totalVenues: venueCount || 0,
      });

      setRecentBookings(recent || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): "enquiry" | "pencil" | "confirmed" | "cancelled" => {
    return status as "enquiry" | "pencil" | "confirmed" | "cancelled";
  };

  if (loading) {
    return <div className="text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Calendar className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmedBookings}</div>
            <p className="text-xs text-muted-foreground">Active confirmed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Artists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArtists}</div>
            <p className="text-xs text-muted-foreground">Total artists registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Venues</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVenues}</div>
            <p className="text-xs text-muted-foreground">Total venues available</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-center text-muted-foreground">No bookings yet. Create your first booking to get started!</p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{booking.artists?.name || "No artist"}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.clients?.name} • {booking.parks?.name} • {booking.venues?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
