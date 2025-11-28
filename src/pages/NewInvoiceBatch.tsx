import { InvoiceBatchForm } from "@/components/InvoiceBatchForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function NewInvoiceBatch() {
  const navigate = useNavigate();

  const createInvoiceBatch = useMutation({
    mutationFn: async (data: any) => {
      // Get selected bookings to calculate VAR invoice number
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("job_code, booking_date, sell_fee")
        .in("id", data.booking_ids)
        .order("booking_date", { ascending: true });

      if (bookingsError) throw bookingsError;
      if (!bookings || bookings.length === 0) throw new Error("No bookings found");

      // Generate VAR invoice number from earliest booking
      const earliestBooking = bookings[0];
      const baseJobCode = earliestBooking.job_code?.split('/').slice(0, 2).join('/') || 'UNKNOWN';
      const varInvoiceNumber = `${baseJobCode}/VAR`;

      // Calculate total amount
      const totalAmount = bookings.reduce((sum, b) => sum + (b.sell_fee || 0), 0);

      // Create invoice batch
      const { data: batch, error: batchError } = await supabase
        .from("invoice_batches")
        .insert({
          client_id: data.client_id,
          batch_date: data.batch_date,
          invoice_number: varInvoiceNumber,
          total_amount: totalAmount,
          notes: data.notes,
          status: 'active',
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Link bookings to batch
      const batchBookings = data.booking_ids.map((bookingId: string) => ({
        batch_id: batch.id,
        booking_id: bookingId,
      }));

      const { error: linkError } = await supabase
        .from("invoice_batch_bookings")
        .insert(batchBookings);

      if (linkError) throw linkError;

      // Create VAR invoice (using first booking as reference, since invoices require a booking_id)
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          booking_id: data.booking_ids[0], // Reference first booking
          invoice_number: varInvoiceNumber,
          amount_due: totalAmount,
          due_date: data.batch_date,
          status: 'draft',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Link invoice to batch
      const { error: updateError } = await supabase
        .from("invoice_batches")
        .update({ batch_invoice_id: invoice.id })
        .eq("id", batch.id);

      if (updateError) throw updateError;

      return batch.id;
    },
    onSuccess: (batchId) => {
      toast.success("VAR invoice batch created successfully");
      navigate(`/invoice-batches/${batchId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Invoice Batch</h1>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Batch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceBatchForm
            onSubmit={(data) => createInvoiceBatch.mutate(data)}
            isSubmitting={createInvoiceBatch.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
