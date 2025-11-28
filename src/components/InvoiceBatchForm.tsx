import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/ui/draft-indicator";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const invoiceBatchFormSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  batch_date: z.string().min(1, "Batch date is required"),
  booking_ids: z.array(z.string()).min(1, "At least one booking is required"),
  notes: z.string().optional(),
});

type InvoiceBatchFormValues = z.infer<typeof invoiceBatchFormSchema>;

interface InvoiceBatchFormProps {
  defaultValues?: Partial<InvoiceBatchFormValues>;
  onSubmit: (data: InvoiceBatchFormValues) => void;
  isSubmitting?: boolean;
  invoiceBatchId?: string;
}

export function InvoiceBatchForm({ defaultValues, onSubmit, isSubmitting, invoiceBatchId }: InvoiceBatchFormProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultValues?.client_id || "");
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const form = useForm<InvoiceBatchFormValues>({
    resolver: zodResolver(invoiceBatchFormSchema),
    defaultValues: defaultValues || {
      client_id: "",
      batch_date: new Date().toISOString().split('T')[0],
      booking_ids: [],
      notes: "",
    },
  });

  const { saveDraft, completeSave, draftStatus } = useFormDraft({
    table: "invoice_batches",
    form,
  });

  const handleSubmit = async (data: InvoiceBatchFormValues) => {
    try {
      await completeSave(data);
      onSubmit(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to save invoice batch");
    }
  };

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["bookings-for-batch", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("id, job_code, description, booking_date, sell_fee, invoiced")
        .eq("client_id", selectedClientId)
        .eq("invoiced", false)
        .order("booking_date");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClientId,
  });

  const selectedBookingIds = form.watch("booking_ids") || [];

  useEffect(() => {
    if (bookings && selectedBookingIds.length > 0) {
      const selected = bookings.filter(b => selectedBookingIds.includes(b.id));
      const total = selected.reduce((sum, b) => sum + (b.sell_fee || 0), 0);
      setTotalAmount(total);
    } else {
      setTotalAmount(0);
    }
  }, [selectedBookingIds, bookings]);

  const bookingOptions = bookings?.map(b => ({
    value: b.id,
    label: `${b.job_code} - ${b.description || 'No description'} (${new Date(b.booking_date).toLocaleDateString()}) - £${b.sell_fee?.toFixed(2) || '0.00'}`
  })) || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <DraftIndicator status={draftStatus} />
        
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client *</FormLabel>
              <Select 
                onValueChange={(value) => { 
                  field.onChange(value); 
                  setSelectedClientId(value);
                  form.setValue("booking_ids", []);
                  saveDraft(); 
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="booking_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Bookings *</FormLabel>
              <FormControl>
                <MultiSelect
                  options={bookingOptions}
                  selected={field.value}
                  onChange={(values) => {
                    field.onChange(values);
                    saveDraft();
                  }}
                  placeholder="Select bookings to include in this batch"
                  disabled={!selectedClientId}
                />
              </FormControl>
              {!selectedClientId && (
                <p className="text-sm text-muted-foreground">Select a client first</p>
              )}
              {selectedClientId && bookings?.length === 0 && (
                <p className="text-sm text-warning">No uninvoiced bookings available for this client</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedBookingIds.length > 0 && (
          <div className="rounded-lg border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Selected Bookings:</span>
              <Badge variant="secondary">{selectedBookingIds.length} booking(s)</Badge>
            </div>
            <div className="text-2xl font-bold text-foreground">
              Total: £{totalAmount.toFixed(2)}
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="batch_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ""} onBlur={() => { field.onBlur(); saveDraft(); }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} onBlur={() => { field.onBlur(); saveDraft(); }} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting || selectedBookingIds.length === 0}>
            {isSubmitting ? "Creating..." : "Create VAR Invoice Batch"}
          </Button>
          <Button type="button" variant="outline" onClick={() => saveDraft()} disabled={isSubmitting}>
            Save Draft
          </Button>
        </div>
      </form>
    </Form>
  );
}
