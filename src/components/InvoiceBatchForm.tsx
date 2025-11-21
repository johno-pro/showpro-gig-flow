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

const invoiceBatchFormSchema = z.object({
  client_id: z.string().optional(),
  batch_date: z.string().optional(),
  invoice_number: z.string().optional(),
  total_amount: z.string().optional(),
  sent: z.boolean().optional(),
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
  const form = useForm<InvoiceBatchFormValues>({
    resolver: zodResolver(invoiceBatchFormSchema),
    defaultValues: defaultValues || {
      client_id: "",
      batch_date: "",
      invoice_number: "",
      total_amount: "",
      sent: false,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <DraftIndicator status={draftStatus} />
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); saveDraft(); }} defaultValue={field.value}>
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
          name="batch_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ""} onBlur={() => { field.onBlur(); saveDraft(); }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="invoice_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Number</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} onBlur={() => { field.onBlur(); saveDraft(); }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="total_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} value={field.value || ""} onBlur={() => { field.onBlur(); saveDraft(); }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Sent</FormLabel>
              </div>
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
                <Textarea {...field} value={field.value || ""} onBlur={() => { field.onBlur(); saveDraft(); }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Invoice Batch"}
          </Button>
          <Button type="button" variant="outline" onClick={() => saveDraft()} disabled={isSubmitting}>
            Save Draft
          </Button>
        </div>
      </form>
    </Form>
  );
}
