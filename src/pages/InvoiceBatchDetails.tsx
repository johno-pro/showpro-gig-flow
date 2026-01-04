import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trash2, FileText, Send, Eye, Download, Save } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { renderInvoicePdf, createBasePdfModel, type InvoicePdfModel, type InvoiceLineItem } from "@/lib/pdf";
import { PdfViewerModal } from "@/components/PdfViewerModal";
import { DocumentsList } from "@/components/DocumentsList";
import { saveDocument, getInvoiceBatchDocuments, type Document } from "@/lib/documents";

export default function InvoiceBatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: batch, isLoading } = useQuery({
    queryKey: ["invoice_batch", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_batches")
        .select(`
          *,
          clients(name, billing_address, vat_number)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: batchBookings } = useQuery({
    queryKey: ["invoice_batch_bookings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_batch_bookings")
        .select(`
          booking_id,
          bookings(
            job_code,
            description,
            booking_date,
            sell_fee,
            artists(name)
          )
        `)
        .eq("batch_id", id);
      if (error) throw error;
      return data;
    },
  });

  const { data: invoice } = useQuery({
    queryKey: ["batch_invoice", batch?.batch_invoice_id],
    queryFn: async () => {
      if (!batch?.batch_invoice_id) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", batch.batch_invoice_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!batch?.batch_invoice_id,
  });

  const sendInvoice = useMutation({
    mutationFn: async () => {
      if (!batch?.batch_invoice_id) throw new Error("No invoice linked to this batch");
      
      // Update invoice status
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq("id", batch.batch_invoice_id);

      if (invoiceError) throw invoiceError;

      // Mark all bookings as invoiced
      const bookingIds = batchBookings?.map(bb => bb.booking_id) || [];
      const { error: bookingsError } = await supabase
        .from("bookings")
        .update({ invoiced: true, invoice_sent: true })
        .in("id", bookingIds);

      if (bookingsError) throw bookingsError;

      // Update batch status
      const { error: batchError } = await supabase
        .from("invoice_batches")
        .update({ 
          sent: true,
          sent_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (batchError) throw batchError;
    },
    onSuccess: () => {
      toast.success("VAR invoice sent successfully");
      queryClient.invalidateQueries({ queryKey: ["invoice_batch", id] });
      queryClient.invalidateQueries({ queryKey: ["batch_invoice"] });
      queryClient.invalidateQueries({ queryKey: ["invoice_batch_bookings", id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteInvoiceBatch = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoice_batches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice batch deleted successfully");
      navigate("/invoice-batches");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

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
      fetchDocuments();
    }
  }, [id]);

  const fetchDocuments = async () => {
    if (!id) return;
    setLoadingDocs(true);
    const docs = await getInvoiceBatchDocuments(id);
    setDocuments(docs);
    setLoadingDocs(false);
  };

  if (isLoading) return <div>Loading...</div>;
  if (!batch) return <div>Invoice batch not found</div>;

  const totalAmount = batchBookings?.reduce((sum, bb) => {
    const booking = bb.bookings as any;
    return sum + (booking?.sell_fee || 0);
  }, 0) || 0;

  // Get first job number for VAR naming
  const firstJobNumber = batchBookings?.[0]?.bookings?.job_code || null;

  const buildVarInvoiceModel = async (): Promise<InvoicePdfModel> => {
    const invoiceDate = batch.batch_date;
    const dueDate = new Date(new Date(batch.batch_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const vatRate = 0.20;

    const lineItems: InvoiceLineItem[] = (batchBookings || []).map((bb) => {
      const booking = bb.bookings as any;
      const sellFee = booking?.sell_fee || 0;
      const net = sellFee / (1 + vatRate);
      const vat = sellFee - net;
      const dateFormatted = new Date(booking?.booking_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return {
        ref: booking?.job_code || "-",
        date: booking?.booking_date,
        description: `${dateFormatted} – ${booking?.artists?.name || "TBC"} – Various`,
        net,
        vat,
        gross: sellFee,
      };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.net, 0);
    const vatAmount = lineItems.reduce((sum, item) => sum + item.vat, 0);

    // Get unique artists
    const artists = [...new Set((batchBookings || []).map((bb) => (bb.bookings as any)?.artists?.name).filter(Boolean))];
    const artistLabel = artists.length === 1 ? artists[0] : "Various";

    // Get company settings from database
    const baseModel = await createBasePdfModel();

    return {
      ...baseModel,
      invoiceNumber: batch.invoice_number || "DRAFT",
      invoiceDate,
      dueDate,
      isVar: true,
      billTo: {
        name: (batch.clients as any)?.name || "Client",
        address: (batch.clients as any)?.billing_address 
          ? (batch.clients as any).billing_address.split("\n") 
          : ["Address line 1", "Address line 2"],
        vatNumber: (batch.clients as any)?.vat_number,
      },
      summary: {
        artist: artistLabel,
        jobNo: "Various",
        venue: "Various",
      },
      lineItems,
      subtotal,
      vatRate,
      vatAmount,
      totalDue: totalAmount,
    };
  };

  const handlePreviewPdf = async () => {
    if (!batch || !batchBookings || batchBookings.length === 0) {
      toast.error("No bookings to generate invoice for");
      return;
    }

    setGeneratingPdf(true);
    try {
      const model = await buildVarInvoiceModel();
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
    if (!pdfBlob || !firstJobNumber) return;
    
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${firstJobNumber}-INVOICE-${firstJobNumber}_VAR.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSavePdf = async () => {
    if (!pdfBlob || !batch || !id) return;
    
    // Validate job number
    if (!firstJobNumber) {
      toast.error("Cannot save: No job number found in batch bookings");
      return;
    }

    setSavingPdf(true);
    try {
      const result = await saveDocument({
        blob: pdfBlob,
        jobNumber: firstJobNumber,
        docType: "invoice",
        invoiceBatchId: id,
        invoiceId: batch.batch_invoice_id || undefined,
        invoiceNumber: `${firstJobNumber}_VAR`,
        isVar: true,
      });

      if (result.success) {
        toast.success("VAR Invoice saved to system");
        setPdfPreviewOpen(false);
        fetchDocuments();
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/invoice-batches")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Invoice Batch Details</h1>
          <p className="text-muted-foreground">{batch.invoice_number}</p>
        </div>
        <Button variant="secondary" onClick={handlePreviewPdf} disabled={generatingPdf}>
          <Eye className="h-4 w-4 mr-2" />
          {generatingPdf ? "Generating..." : "Preview PDF"}
        </Button>
        {!batch.sent && (
          <Button onClick={() => sendInvoice.mutate()} disabled={sendInvoice.isPending}>
            <Send className="h-4 w-4 mr-2" />
            {sendInvoice.isPending ? "Sending..." : "Send VAR Invoice"}
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice Batch</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this invoice batch? This will also delete the associated VAR invoice.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteInvoiceBatch.mutate()}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{(batch.clients as any)?.name}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Batch Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{new Date(batch.batch_date).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">£{totalAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {invoice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              VAR Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="text-lg font-semibold">{invoice.invoice_number}</p>
              </div>
              <div>
                <Badge variant={invoice.status === 'sent' ? 'default' : 'secondary'}>
                  {invoice.status?.toUpperCase()}
                </Badge>
                {invoice.sent_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Sent: {new Date(invoice.sent_at).toLocaleString()}
                  </p>
                )}
              </div>
              <Button asChild variant="outline">
                <Link to={`/invoices/${invoice.id}`}>View Invoice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Included Bookings ({batchBookings?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Code</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchBookings?.map((bb) => {
                const booking = bb.bookings as any;
                return (
                  <TableRow key={bb.booking_id}>
                    <TableCell className="font-medium">{booking?.job_code}</TableCell>
                    <TableCell>{booking?.artists?.name}</TableCell>
                    <TableCell>{booking?.description || '-'}</TableCell>
                    <TableCell>{new Date(booking?.booking_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">£{booking?.sell_fee?.toFixed(2) || '0.00'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {batch.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{batch.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents Section */}
      <DocumentsList
        documents={documents}
        onRefresh={fetchDocuments}
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
        title={`VAR Invoice Preview - ${batch.invoice_number || "Draft"}`}
        onDownload={handleDownloadPdf}
        onSave={handleSavePdf}
        saving={savingPdf}
        canSave={!!firstJobNumber}
      />
    </div>
  );
}
