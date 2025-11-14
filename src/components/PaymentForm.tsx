import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/ui/draft-indicator";
import { toast } from "sonner";

const paymentFormSchema = z.object({
  booking_id: z.string().optional(),
  amount: z.string().optional(),
  payment_type: z.string().optional(),
  payment_date: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  defaultValues?: Partial<PaymentFormValues>;
  onSubmit: (data: PaymentFormValues) => void;
  isSubmitting?: boolean;
  paymentId?: string;
}

export function PaymentForm({ defaultValues, onSubmit, isSubmitting, paymentId }: PaymentFormProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: defaultValues || {
      booking_id: "",
      amount: "",
      payment_type: "",
      payment_date: "",
      notes: "",
    },
  });

  const { saveDraft, completeSave, draftStatus } = useFormDraft({
    table: "payments",
    formId: paymentId,
    form,
  });

  const handleSubmit = async (data: PaymentFormValues) => {
    try {
      await completeSave(data);
      onSubmit(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to save payment");
    }
  };

  const { data: bookings } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_date, status")
        .order("booking_date", { ascending: false });
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
          name="booking_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Booking</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); saveDraft(); }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a booking" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bookings?.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {new Date(booking.booking_date).toLocaleDateString()} - {booking.status}
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} value={field.value || ""} onBlur={() => { field.onBlur(); saveDraft(); }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Type</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); saveDraft(); }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="full">Full Payment</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Date</FormLabel>
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
                <Textarea {...field} value={field.value || ""} onBlur={() => { field.onBlur(); saveDraft(); }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Payment"}
          </Button>
          <Button type="button" variant="outline" onClick={() => saveDraft()} disabled={isSubmitting}>
            Save Draft
          </Button>
        </div>
      </form>
    </Form>
  );
}
