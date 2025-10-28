import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Phone, Mail, Building2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LocationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState<any>(null);
  const [venues, setVenues] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLocationDetails();
      fetchVenues();
      fetchBookings();
    }
  }, [id]);

  const fetchLocationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select(`
          *,
          clients:clients(id, name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      setLocation(data);
    } catch (error: any) {
      toast.error("Failed to fetch location details");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("location_id", id)
        .order("name");

      if (error) throw error;
      setVenues(data || []);
    } catch (error: any) {
      console.error("Error:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_date,
          status,
          artists:artists(name),
          venues:venues(name)
        `)
        .eq("location_id", id)
        .order("booking_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("locations").delete().eq("id", id);

      if (error) throw error;
      toast.success("Location deleted successfully");
      navigate("/locations");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete location");
      console.error("Error:", error);
    }
  };

  if (loading) {
    return <div className="text-center">Loading location details...</div>;
  }

  if (!location) {
    return <div className="text-center">Location not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/locations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{location.name}</h1>
            <p className="text-muted-foreground">
              {location.clients?.name || "No client assigned"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/locations/${id}/edit`)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {location.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                  {location.postcode && (
                    <p className="text-sm text-muted-foreground">{location.postcode}</p>
                  )}
                </div>
              </div>
            )}

            {location.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{location.phone}</p>
                </div>
              </div>
            )}

            {location.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{location.email}</p>
                </div>
              </div>
            )}

            {location.notes && (
              <div>
                <p className="text-sm font-medium mb-2">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{location.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Venues</span>
              <span className="text-2xl font-bold">{venues.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recent Bookings</span>
              <span className="text-2xl font-bold">{bookings.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Venues ({venues.length})</CardTitle>
            <Button size="sm" onClick={() => navigate("/venues/new")}>
              Add Venue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {venues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No venues yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">{venue.name}</p>
                    {venue.capacity && (
                      <p className="text-sm text-muted-foreground">
                        Capacity: {venue.capacity}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/venues/${venue.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No bookings yet</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{booking.artists?.name || "No artist"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.booking_date).toLocaleDateString()} •{" "}
                      {booking.venues?.name || "No venue"}
                    </p>
                  </div>
                  <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this location. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
