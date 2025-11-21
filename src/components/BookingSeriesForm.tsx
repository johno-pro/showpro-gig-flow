import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/ui/draft-indicator";

const bookingSeriesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  client_id: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  pattern: z.string().optional(),
});

type BookingSeriesFormData = z.infer<typeof bookingSeriesSchema>;

interface BookingSeriesFormProps {
  defaultValues?: Partial<BookingSeriesFormData>;
  onSubmit: (data: BookingSeriesFormData) => void;
  isSubmitting: boolean;
  bookingSeriesId?: string;
}

export function BookingSeriesForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  bookingSeriesId,
}: BookingSeriesFormProps) {
  const [clients, setClients] = useState<any[]>([]);

  const form = useForm<BookingSeriesFormData>({
    resolver: zodResolver(bookingSeriesSchema),
    defaultValues: {
      name: "",
      pattern: "weekly",
      ...defaultValues,
    },
  });

  const { draftStatus, saveDraft, completeSave } = useFormDraft({
    table: "booking_series",
    form,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      toast.error("Failed to load clients");
    }
  };

  const handleSubmit = async (data: BookingSeriesFormData) => {
    try {
      await completeSave(data as any);
      onSubmit(data);
    } catch (error) {
      toast.error("Failed to save booking series");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex justify-end mb-2">
          <DraftIndicator status={draftStatus} />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Series Name *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter series name"
                  onBlur={() => saveDraft()}
                />
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
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  saveDraft();
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    onBlur={() => saveDraft()}
                  />
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
                <FormLabel>End Date *</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    onBlur={() => saveDraft()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="pattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pattern</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  saveDraft();
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => saveDraft()}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : bookingSeriesId ? "Update" : "Create"} Series
          </Button>
        </div>
      </form>
    </Form>
  );
}
