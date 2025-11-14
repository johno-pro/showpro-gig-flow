import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/ui/draft-indicator";
import { useEffect } from "react";

const bookingSeriesFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  client_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  pattern: z.string().optional(),
});

type BookingSeriesFormValues = z.infer<typeof bookingSeriesFormSchema>;

interface BookingSeriesFormProps {
  defaultValues?: Partial<BookingSeriesFormValues>;
  onSubmit: (data: BookingSeriesFormValues) => void;
  isSubmitting?: boolean;
  seriesId?: string;
}

export function BookingSeriesForm({ defaultValues, onSubmit, isSubmitting, seriesId }: BookingSeriesFormProps) {
  const form = useForm<BookingSeriesFormValues>({
    resolver: zodResolver(bookingSeriesFormSchema),
    defaultValues: defaultValues || {
      name: "",
      client_id: "",
      start_date: "",
      end_date: "",
      pattern: "",
    },
  });

  const { saveDraft, loadDraft, draftStatus } = useFormDraft({
    table: "booking_series",
    formId: seriesId,
    form,
  });

  useEffect(() => {
    if (!seriesId && !defaultValues) {
      loadDraft();
    }
  }, [seriesId, defaultValues]);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} onBlur={(e) => { field.onBlur(e); saveDraft(); }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select onValueChange={(val) => { field.onChange(val); saveDraft(); }} defaultValue={field.value}>
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
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} onBlur={(e) => { field.onBlur(e); saveDraft(); }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} onBlur={(e) => { field.onBlur(e); saveDraft(); }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pattern</FormLabel>
              <Select onValueChange={(val) => { field.onChange(val); saveDraft(); }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pattern" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => saveDraft()}>
            Save Draft
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Booking Series"}
          </Button>
          <DraftIndicator status={draftStatus} />
        </div>
      </form>
    </Form>
  );
}
