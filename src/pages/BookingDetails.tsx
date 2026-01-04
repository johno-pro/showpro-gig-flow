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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit, Trash2, Calendar, Clock, DollarSign, FileText, Plus, Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { BookingFormTabbed } from "@/components/BookingFormTabbed";
import { CopyJobDialog } from "@/components/CopyJobDialog";
import { QuickEditField } from "@/components/QuickEditField";
import { downloadInvoicePdf, createBasePdfModel, type InvoicePdfModel } from "@/lib/pdf";

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [invoiceForm, setInvoiceForm] = useState({
    amount_due: "",
    due_date: "",
    payment_link: "",
    artist_payment_link: "",
  });
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  useEffect(() => {
    if (id) {
      fetchBooking();
      fetchDropdownData();
    }
  }, [id]);

  const fetchDropdownData = async () => {
    const [artistsRes, clientsRes, locationsRes, venuesRes] = await Promise.all([
      supabase.from("artists").select("id, name").eq("status", "active").order("name"),
      supabase.from("clients").select("id, name").eq("status", "active").order("name"),
      supabase.from("locations").select("id, name").eq("status", "active").order("name"),
      supabase.from("venues").select("id, name").eq("status", "active").order("name"),
    ]);
    if (artistsRes.data) setArtists(artistsRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    if (locationsRes.data) setLocations(locationsRes.data);
    if (venuesRes.data) setVenues(venuesRes.data);
  };

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

      // Fetch related invoice if exists
      const { data: invoiceData } = await supabase
        .from("invoices")
        .select("*")
        .eq("booking_id", id)
        .maybeSingle();

      if (invoiceData) {
        setInvoice(invoiceData);
      }
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

  const handleCreateInvoice = async () => {
    if (!invoiceForm.amount_due || !invoiceForm.due_date) {
      toast.error("Please fill in amount and due date");
      return;
    }

    setCreatingInvoice(true);
    try {
      // Generate invoice_number from booking job_code
      let invoiceNumber = booking.job_code;
      
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          booking_id: id,
          amount_due: parseFloat(invoiceForm.amount_due),
          due_date: invoiceForm.due_date,
          payment_link: invoiceForm.payment_link || null,
          artist_payment_link: invoiceForm.artist_payment_link || null,
          invoice_number: invoiceNumber,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      // Update booking to mark as invoiced
      await supabase
        .from("bookings")
        .update({ invoiced: true })
        .eq("id", id);

      toast.success("Invoice created successfully");
      setInvoice(data);
      setShowInvoiceDialog(false);
      setInvoiceForm({
        amount_due: "",
        due_date: "",
        payment_link: "",
        artist_payment_link: "",
      });
      fetchBooking(); // Refresh booking data
    } catch (error: any) {
      toast.error(error.message || "Failed to create invoice");
      console.error(error);
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (!booking || !invoiceForm.amount_due) {
      toast.error("Please enter an amount before previewing");
      return;
    }

    setGeneratingPdf(true);
    try {
      const invoiceDate = new Date().toISOString().split("T")[0];
      const dueDate = invoiceForm.due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const amount = parseFloat(invoiceForm.amount_due);
      const vatRate = booking.vat_applicable ? (booking.vat_rate || 0.20) : 0;
      const netAmount = amount / (1 + vatRate);
      const vatAmount = amount - netAmount;

      const dateFormatted = new Date(booking.booking_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // Get company settings from database
      const baseModel = await createBasePdfModel();

      const model: InvoicePdfModel = {
        ...baseModel,
        invoiceNumber: booking.job_code || "DRAFT",
        invoiceDate,
        dueDate,
        isVar: false,
        billTo: {
          name: booking.clients?.name || "Client",
          address: ["Address line 1", "Address line 2"],
        },
        summary: {
          artist: booking.artists?.name || "TBC",
          jobNo: booking.job_code || "TBC",
          venue: booking.venues?.name || booking.locations?.name || "TBC",
        },
        lineItems: [
          {
            ref: booking.job_code || "DRAFT",
            date: booking.booking_date,
            description: `${dateFormatted} – ${booking.artists?.name || "TBC"} – ${booking.venues?.name || booking.locations?.name || "TBC"}`,
            net: netAmount,
            vat: vatAmount,
            gross: amount,
          },
        ],
        subtotal: netAmount,
        vatRate,
        vatAmount,
        totalDue: amount,
      };

      await downloadInvoicePdf(model, `invoice-preview-${booking.job_code || "draft"}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Booking Details</h1>
              {booking?.job_code && (
                <code className="text-lg font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                  {booking.job_code}
                </code>
              )}
            </div>
            <p className="text-muted-foreground">View and manage booking information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCopyDialog(true)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Job
          </Button>
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
              <div className="mt-1">
                <QuickEditField
                  bookingId={id!}
                  field="booking_date"
                  value={booking.booking_date}
                  displayValue={new Date(booking.booking_date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  type="date"
                  onUpdate={fetchBooking}
                />
              </div>
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
              <div className="mt-1">
                <QuickEditField
                  bookingId={id!}
                  field="artist_id"
                  value={booking.artist_id}
                  displayValue={booking.artists?.name || "Not assigned"}
                  type="select"
                  options={artists}
                  onUpdate={fetchBooking}
                />
              </div>
              {booking.artists?.act_type && (
                <p className="text-sm text-muted-foreground">{booking.artists.act_type}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Client</p>
              <div className="mt-1">
                <QuickEditField
                  bookingId={id!}
                  field="client_id"
                  value={booking.client_id}
                  displayValue={booking.clients?.name || "Not assigned"}
                  type="select"
                  options={clients}
                  onUpdate={fetchBooking}
                />
              </div>
            </div>

            {booking.locations && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <div className="mt-1">
                  <QuickEditField
                    bookingId={id!}
                    field="location_id"
                    value={booking.location_id}
                    displayValue={booking.locations?.name || "Not assigned"}
                    type="select"
                    options={locations}
                    onUpdate={fetchBooking}
                  />
                </div>
              </div>
            )}

            {booking.venues && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Venue</p>
                <div className="mt-1">
                  <QuickEditField
                    bookingId={id!}
                    field="venue_id"
                    value={booking.venue_id}
                    displayValue={booking.venues?.name || "Not assigned"}
                    type="select"
                    options={venues}
                    onUpdate={fetchBooking}
                  />
                </div>
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

            <div>
              <p className="text-sm font-medium text-muted-foreground">Buy Fee</p>
              <div className="mt-1">
                <QuickEditField
                  bookingId={id!}
                  field="buy_fee"
                  value={booking.buy_fee}
                  displayValue={booking.buy_fee ? `£${parseFloat(booking.buy_fee).toFixed(2)}` : "Not set"}
                  type="currency"
                  onUpdate={fetchBooking}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Sell Fee</p>
              <div className="mt-1">
                <QuickEditField
                  bookingId={id!}
                  field="sell_fee"
                  value={booking.sell_fee}
                  displayValue={booking.sell_fee ? `£${parseFloat(booking.sell_fee).toFixed(2)}` : "Not set"}
                  type="currency"
                  onUpdate={fetchBooking}
                />
              </div>
            </div>

            {booking.deposit_amount !== null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deposit Amount</p>
                <div className="mt-1">
                  <QuickEditField
                    bookingId={id!}
                    field="deposit_amount"
                    value={booking.deposit_amount}
                    displayValue={booking.deposit_amount ? `£${parseFloat(booking.deposit_amount).toFixed(2)}` : "Not set"}
                    type="currency"
                    onUpdate={fetchBooking}
                  />
                </div>
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
                <div className="flex items-center gap-2">
                  <Badge variant={booking.invoiced ? "default" : "secondary"}>
                    {booking.invoiced ? "Yes" : "No"}
                  </Badge>
                  {invoice ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                    >
                      View Invoice
                    </Button>
                  ) : (
                    <Dialog open={showInvoiceDialog} onOpenChange={(open) => {
                      setShowInvoiceDialog(open);
                      if (open && booking.sell_fee) {
                        setInvoiceForm(prev => ({
                          ...prev,
                          amount_due: booking.sell_fee.toString()
                        }));
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={booking.invoiced}>
                          <Plus className="mr-2 h-3 w-3" />
                          Create Invoice
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Invoice</DialogTitle>
                          <DialogDescription>
                            Create an invoice for this booking. The booking will be marked as invoiced.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount_due">Amount Due *</Label>
                            <Input
                              id="amount_due"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={invoiceForm.amount_due}
                              onChange={(e) =>
                                setInvoiceForm({ ...invoiceForm, amount_due: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="due_date">Due Date *</Label>
                            <Input
                              id="due_date"
                              type="date"
                              value={invoiceForm.due_date}
                              onChange={(e) =>
                                setInvoiceForm({ ...invoiceForm, due_date: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="payment_link">Payment Link</Label>
                            <Input
                              id="payment_link"
                              type="url"
                              placeholder="https://..."
                              value={invoiceForm.payment_link}
                              onChange={(e) =>
                                setInvoiceForm({ ...invoiceForm, payment_link: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="artist_payment_link">Artist Payment Link</Label>
                            <Input
                              id="artist_payment_link"
                              type="url"
                              placeholder="https://..."
                              value={invoiceForm.artist_payment_link}
                              onChange={(e) =>
                                setInvoiceForm({
                                  ...invoiceForm,
                                  artist_payment_link: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <Button
                            variant="outline"
                            onClick={() => setShowInvoiceDialog(false)}
                            disabled={creatingInvoice || generatingPdf}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={handlePreviewPdf}
                            disabled={!invoiceForm.amount_due || generatingPdf || creatingInvoice}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {generatingPdf ? "Generating..." : "Preview PDF"}
                          </Button>
                          <Button onClick={handleCreateInvoice} disabled={creatingInvoice || generatingPdf}>
                            {creatingInvoice ? "Creating..." : "Create Invoice"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
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

      <CopyJobDialog
        booking={booking}
        open={showCopyDialog}
        onOpenChange={setShowCopyDialog}
        onSuccess={(newId) => navigate(`/bookings/${newId}`)}
      />
    </div>
  );
}
