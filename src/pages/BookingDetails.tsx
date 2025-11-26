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
import { ArrowLeft, Edit, Trash2, Calendar, Clock, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";
import { BookingFormTabbed } from "@/components/BookingFormTabbed";

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          artists (id, name, act_type),
          clients (id, name),
          venues (id, name),
          locations (id, name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error: any) {
      toast.error("Failed to fetch booking details");
      console.error(error);
      navigate("/bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", id);

      if (error) throw error;

      toast.success("Booking deleted successfully");
      navigate("/bookings");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete booking");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: "enquiry" | "pencil" | "confirmed" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success("Status updated successfully");
      fetchBooking();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
      console.error(error);
    }
  };

  const getStatusBadgeVariant = (status: string): "enquiry" | "pencil" | "confirmed" | "cancelled" => {
    return status as "enquiry" | "pencil" | "confirmed" | "cancelled";
  };

  if (loading) {
    return <div className="text-center">Loading booking details...</div>;
  }

  if (!booking) {
    return <div className="text-center">Booking not found</div>;
  }

  if (editMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setEditMode(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Booking</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <BookingFormTabbed
              bookingId={id}
              onSuccess={() => {
                setEditMode(false);
                fetchBooking();
              }}
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/bookings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground">View and manage booking information</p>
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
                  This action cannot be undone. This will permanently delete the booking.
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
              <Calendar className="h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
                <div className="flex gap-1">
                  {booking.status !== "enquiry" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate("enquiry")}
                    >
                      Set Enquiry
                    </Button>
                  )}
                  {booking.status !== "confirmed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate("confirmed")}
                    >
                      Confirm
                    </Button>
                  )}
                  {booking.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate("cancelled")}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="mt-1">{new Date(booking.booking_date).toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</p>
            </div>

            {(booking.start_time || booking.end_time) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time</p>
                <p className="mt-1">
                  {booking.start_time || "—"} {booking.end_time && `- ${booking.end_time}`}
                </p>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Artist</p>
              <p className="mt-1 font-medium">{booking.artists?.name || "Not assigned"}</p>
              {booking.artists?.act_type && (
                <p className="text-sm text-muted-foreground">{booking.artists.act_type}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Client</p>
              <p className="mt-1">{booking.clients?.name}</p>
            </div>

            {booking.locations && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="mt-1">{booking.locations.name}</p>
              </div>
            )}

            {booking.venues && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Venue</p>
                <p className="mt-1">{booking.venues.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fee Model</p>
              <p className="mt-1 capitalize">{booking.fee_model}</p>
            </div>

            {booking.commission_rate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Rate</p>
                <p className="mt-1">{booking.commission_rate}%</p>
              </div>
            )}

            <Separator />

            {booking.artist_fee && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Artist Fee</p>
                <p className="mt-1 text-lg font-semibold">
                  £{parseFloat(booking.artist_fee).toFixed(2)}
                </p>
              </div>
            )}

            {booking.client_fee && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client Fee</p>
                <p className="mt-1 text-lg font-semibold">
                  £{parseFloat(booking.client_fee).toFixed(2)}
                </p>
              </div>
            )}

            {booking.deposit_amount && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deposit Amount</p>
                <p className="mt-1">£{parseFloat(booking.deposit_amount).toFixed(2)}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">VAT Applicable</span>
                <Badge variant={booking.vat_applicable ? "default" : "secondary"}>
                  {booking.vat_applicable ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Deposit Paid</span>
                <Badge variant={booking.deposit_paid ? "default" : "secondary"}>
                  {booking.deposit_paid ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Balance Paid</span>
                <Badge variant={booking.balance_paid ? "default" : "secondary"}>
                  {booking.balance_paid ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Invoiced</span>
                <Badge variant={booking.invoiced ? "default" : "secondary"}>
                  {booking.invoiced ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {booking.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{booking.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
