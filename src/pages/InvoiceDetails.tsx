import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import { ArrowLeft, Calendar, DollarSign, FileText, ExternalLink, XCircle, Send, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function InvoiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [sending, setSending] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

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

      // Fetch audit trail
      const { data: auditData, error: auditError } = await supabase
        .from("invoice_actions")
        .select("*")
        .eq("invoice_id", id)
        .order("timestamp", { ascending: false });

      if (!auditError && auditData) {
        setAuditTrail(auditData);
      }
    } catch (error: any) {
      toast.error("Failed to fetch invoice details");
      console.error(error);
      navigate("/invoice-batches");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    setSending(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ 
          status: "sent",
          sent_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Invoice sent successfully");
      setShowSendConfirm(false);
      fetchInvoice();
    } catch (error: any) {
      toast.error(error.message || "Failed to send invoice");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvoice = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Invoice cancelled successfully");
      fetchInvoice();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel invoice");
      console.error(error);
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivateInvoice = async () => {
    setReactivating(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "draft" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Invoice reactivated successfully");
      fetchInvoice();
    } catch (error: any) {
      toast.error(error.message || "Failed to reactivate invoice");
      console.error(error);
    } finally {
      setReactivating(false);
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
            <p className="text-muted-foreground">View and manage invoice information</p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === "cancelled" && (
            <Button 
              variant="outline" 
              onClick={handleReactivateInvoice}
              disabled={reactivating}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reactivate Invoice
            </Button>
          )}
          {invoice.status === "draft" && (
            <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
              <AlertDialogTrigger asChild>
                <Button className="bg-success hover:bg-success/90" disabled={sending}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invoice
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send Invoice?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Invoice Total: £{parseFloat(invoice.amount_due).toFixed(2)}
                    <br />
                    This will mark the invoice as sent and update all linked bookings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSendInvoice}>
                    Send Invoice
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {invoice.status !== "cancelled" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={cancelling}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Invoice
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Invoice?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the invoice as cancelled and allow the bookings to be re-invoiced.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, keep it</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelInvoice}>
                    Yes, cancel invoice
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
              <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
              <p className="mt-1 font-mono">{invoice.invoice_number || "—"}</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge 
                className="mt-1" 
                variant={
                  invoice.status === "sent" ? "default" : 
                  invoice.status === "paid" ? "default" : 
                  invoice.status === "cancelled" ? "destructive" : 
                  "secondary"
                }
              >
                {invoice.status?.toUpperCase() || "DRAFT"}
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

            {invoice.sent_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sent At</p>
                <p className="mt-1">{new Date(invoice.sent_at).toLocaleString("en-GB", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
              </div>
            )}

            <Separator />

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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditTrail.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {auditTrail.map((action) => (
                    <div key={action.id} className="flex items-start gap-3 text-sm">
                      <div className="flex-1">
                        <p className="font-medium capitalize">{action.action}</p>
                        <p className="text-muted-foreground">
                          {new Date(action.timestamp).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {action.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{action.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
