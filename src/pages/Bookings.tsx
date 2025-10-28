import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          parks (name)
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
          <CardTitle>All Bookings ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No bookings yet</h3>
              <p className="mb-4 text-muted-foreground">Get started by creating your first booking</p>
              <Button onClick={() => navigate("/bookings/new")}>
                <Plus className="h-4 w-4" />
                Create Booking
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
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
                      {booking.clients?.name} • {booking.parks?.name || "No park"} • {booking.venues?.name || "No venue"}
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
