import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, DollarSign, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function InvoiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      
      if (!invoiceData) {
        toast.error("Invoice not found");
        navigate("/invoice-batches");
        return;
      }

      setInvoice(invoiceData);

      // Fetch related booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          artists (id, name),
          clients (id, name),
          venues (id, name),
          locations (id, name)
        `)
        .eq("id", invoiceData.booking_id)
        .maybeSingle();

      if (bookingError) throw bookingError;
      setBooking(bookingData);
    } catch (error: any) {
      toast.error("Failed to fetch invoice details");
      console.error(error);
      navigate("/invoice-batches");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading invoice details...</div>;
  }

  if (!invoice) {
    return <div className="text-center">Invoice not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Invoice Details</h1>
            <p className="text-muted-foreground">View invoice information</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={invoice.status === "paid" ? "default" : "secondary"} className="mt-1">
                {invoice.status}
              </Badge>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount Due</p>
              <p className="mt-1 text-2xl font-bold">
                £{parseFloat(invoice.amount_due).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Due Date</p>
              <p className="mt-1">{new Date(invoice.due_date).toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</p>
            </div>

            {invoice.payment_link && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Link</p>
                <a
                  href={invoice.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 text-primary hover:underline"
                >
                  View Payment Link
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {invoice.artist_payment_link && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Artist Payment Link</p>
                <a
                  href={invoice.artist_payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 text-primary hover:underline"
                >
                  View Artist Payment Link
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {booking && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Related Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Booking Date</p>
                <p className="mt-1">{new Date(booking.booking_date).toLocaleDateString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
              </div>

              <Separator />

              {booking.artists && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Artist</p>
                  <p className="mt-1 font-medium">{booking.artists.name}</p>
                </div>
              )}

              {booking.clients && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <p className="mt-1">{booking.clients.name}</p>
                </div>
              )}

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

              <Separator />

              <Button asChild variant="outline" className="w-full">
                <Link to={`/bookings/${booking.id}`}>
                  View Full Booking Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
