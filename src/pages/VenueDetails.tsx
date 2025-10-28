import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, Building, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { VenueForm } from "@/components/VenueForm";

export default function VenueDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVenueData();
    }
  }, [id]);

  const fetchVenueData = async () => {
    try {
      const [venueRes, bookingsRes] = await Promise.all([
        supabase
          .from("venues")
          .select(`
            *,
            parks (id, name)
          `)
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("bookings")
          .select(`
            *,
            artists (name),
            clients (name)
          `)
          .eq("venue_id", id)
          .order("booking_date", { ascending: false }),
      ]);

      if (venueRes.error) throw venueRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      if (!venueRes.data) {
        toast.error("Venue not found");
        navigate("/venues");
        return;
      }

      setVenue(venueRes.data);
      setBookings(bookingsRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch venue details");
      console.error(error);
      navigate("/venues");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("venues").delete().eq("id", id);

      if (error) throw error;

      toast.success("Venue deleted successfully");
      navigate("/venues");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete venue");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadgeVariant = (status: string): "enquiry" | "pencil" | "confirmed" | "cancelled" => {
    return status as "enquiry" | "pencil" | "confirmed" | "cancelled";
  };

  if (loading) {
    return <div className="text-center">Loading venue details...</div>;
  }

  if (!venue) {
    return <div className="text-center">Venue not found</div>;
  }

  if (editMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setEditMode(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Venue</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <VenueForm
              venueId={id}
              onSuccess={() => {
                setEditMode(false);
                fetchVenueData();
              }}
              onCancel={() => setEditMode(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/venues")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Venue Details</h1>
            <p className="text-muted-foreground">View and manage venue information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditMode(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the venue
                  {bookings.length > 0 &&
                    `. Note: This venue has ${bookings.length} booking(s) associated with it.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Venue Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="mt-1 text-lg font-semibold">{venue.name}</p>
            </div>

            <Separator />

            {venue.parks && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Park</p>
                <p className="mt-1">{venue.parks.name}</p>
              </div>
            )}

            {venue.capacity && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                  <p className="mt-1 text-2xl font-semibold">{venue.capacity}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
              <p className="mt-1 text-3xl font-bold">{bookings.length}</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Confirmed Bookings</p>
              <p className="mt-1 text-2xl font-semibold">
                {bookings.filter((b) => b.status === "confirmed").length}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Bookings</p>
              <p className="mt-1 text-2xl font-semibold">
                {
                  bookings.filter(
                    (b) =>
                      new Date(b.booking_date) >= new Date() &&
                      b.status !== "cancelled"
                  ).length
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {venue.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{venue.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking History ({bookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No bookings yet for this venue
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
                      <p className="font-medium">
                        {booking.artists?.name || "No artist"}
                      </p>
                      <Badge variant={getStatusBadgeVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.clients?.name || "Unknown Client"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                      {booking.start_time && <span>{booking.start_time}</span>}
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
