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
import { ArrowLeft, Calendar, DollarSign, FileText, ExternalLink, XCircle, Send, RotateCcw, Eye, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { PdfViewerModal } from "@/components/PdfViewerModal";
import { DocumentsList } from "@/components/DocumentsList";
import { renderInvoicePdf, createBasePdfModel, type InvoicePdfModel } from "@/lib/pdf";
import { saveDocument, getBookingDocuments, type Document } from "@/lib/documents";

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
  
  // PDF Preview state
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  
  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchDocuments = async (bookingId: string) => {
    setLoadingDocs(true);
    const docs = await getBookingDocuments(bookingId);
    setDocuments(docs);
    setLoadingDocs(false);
  };

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
      
      // Fetch documents for this booking
      if (bookingData?.id) {
        fetchDocuments(bookingData.id);
      }

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

  const buildInvoiceModel = async (): Promise<InvoicePdfModel> => {
    if (!invoice || !booking) throw new Error("Missing invoice or booking data");
    
    const invoiceDate = invoice.created_at?.split("T")[0] || new Date().toISOString().split("T")[0];
    const dueDate = invoice.due_date;
    const amount = parseFloat(invoice.amount_due);
    const vatRate = booking.vat_applicable ? (booking.vat_rate || 0.20) : 0;
    const netAmount = amount / (1 + vatRate);
    const vatAmount = amount - netAmount;

    const dateFormatted = new Date(booking.booking_date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const baseModel = await createBasePdfModel();

    return {
      ...baseModel,
      invoiceNumber: invoice.invoice_number || booking.job_code || "DRAFT",
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
  };

  const handlePreviewPdf = async () => {
    if (!invoice || !booking) {
      toast.error("Missing invoice or booking data");
      return;
    }

    setGeneratingPdf(true);
    try {
      const model = await buildInvoiceModel();
      const blob = await renderInvoicePdf(model);
      const url = URL.createObjectURL(blob);
      
      setPdfBlob(blob);
      setPdfPreviewUrl(url);
      setPdfPreviewOpen(true);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBlob) return;
    
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.invoice_number || booking?.job_code || "invoice"}-INVOICE.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSavePdf = async () => {
    if (!pdfBlob || !booking || !invoice) return;
    
    const jobNumber = booking.job_code;
    if (!jobNumber) {
      toast.error("Cannot save: Job number is required");
      return;
    }

    setSavingPdf(true);
    try {
      const result = await saveDocument({
        blob: pdfBlob,
        jobNumber,
        docType: "invoice",
        bookingId: booking.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number || jobNumber,
        isVar: false,
      });

      if (result.success) {
        toast.success("Invoice saved to system");
        setPdfPreviewOpen(false);
        if (booking.id) {
          fetchDocuments(booking.id);
        }
      } else {
        toast.error(result.error || "Failed to save invoice");
      }
    } catch (error: any) {
      console.error("Save PDF error:", error);
      toast.error("Failed to save invoice");
    } finally {
      setSavingPdf(false);
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
          <Button variant="secondary" onClick={handlePreviewPdf} disabled={generatingPdf || !booking}>
            <Eye className="mr-2 h-4 w-4" />
            {generatingPdf ? "Generating..." : "Preview PDF"}
          </Button>
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

      {/* Documents Section */}
      <DocumentsList
        documents={documents}
        onRefresh={() => booking?.id && fetchDocuments(booking.id)}
        loading={loadingDocs}
      />

      {/* PDF Preview Modal */}
      <PdfViewerModal
        open={pdfPreviewOpen}
        onOpenChange={(open) => {
          setPdfPreviewOpen(open);
          if (!open && pdfPreviewUrl) {
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
            setPdfBlob(null);
          }
        }}
        pdfUrl={pdfPreviewUrl}
        title={`Invoice Preview - ${invoice?.invoice_number || "Draft"}`}
        onDownload={handleDownloadPdf}
        onSave={handleSavePdf}
        saving={savingPdf}
        canSave={!!booking?.job_code}
      />
    </div>
  );
}
