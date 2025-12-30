import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const bookingSchema = z.object({
  artist_id: z.string().min(1, "Artist is required"),
  venue_id: z.string().min(1, "Venue is required"),
  client_id: z.string().optional(),
  booking_date: z.date(),
  arrival_time: z.string().optional(),
  start_time: z.string().optional(),
  finish_time: z.string().optional(),
  total_rate: z.number().optional(),
  notes: z.string().optional(),
  status: z.enum(["confirmed", "pencilled", "cancelled"]).default("confirmed"),
});

export function BookingForm({ defaultValues, onSuccess }: { defaultValues?: any; onSuccess?: () => void }) {
  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      status: "confirmed",
      booking_date: new Date(),
      ...defaultValues,
    },
  });

  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: artists } = useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: venues } = useQuery({
    queryKey: ["venues"],
    queryFn: async () => {
      const { data, error } = await supabase.from("venues").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const insertBooking = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("bookings").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const onSubmit = async (values: any) => {
    try {
      setSaving(true);
      await insertBooking.mutateAsync(values);
      toast.success("Booking created");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="times">Times</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TabsContent value="details" className="space-y-4">
            <FormField
              control={form.control}
              name="artist_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select artist" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {artists?.map((artist) => (
                        <SelectItem key={artist.id} value={artist.id}>
                          {artist.name}
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
              name="venue_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {venues?.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
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
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client (optional)</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {clients?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="booking_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <Calendar
                    selected={field.value}
                    onSelect={field.onChange}
                    mode="single"
                    className="rounded-md border"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="times" className="space-y-4">
            <FormField
              control={form.control}
              name="arrival_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arrival Time</FormLabel>
                  <Input placeholder="18:00" {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <Input placeholder="20:00" {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finish_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finish Time</FormLabel>
                  <Input placeholder="23:00" {...field} />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="notes">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <Input placeholder="Add any notes…" {...field} />
                </FormItem>
              )}
            />
          </TabsContent>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Create Booking"}
          </Button>
        </form>
      </Form>
    </Tabs>
  );
}
// Auto-default performance times based on keywords
useEffect(() => {
  const { artist_id, notes = "" } = form.watch();
  const lowerNotes = notes.toLowerCase();

  // Fetch artist name if needed (or pass from dropdown data)
  const artist = artists.find((a) => a.id === artist_id);
  const artistName = artist?.name?.toLowerCase() || "";

  const combinedText = `${artistName} ${lowerNotes}`;

  let defaultStart = new Date();
  let defaultEnd = new Date();

  if (
    combinedText.includes("wrestling") ||
    combinedText.includes("waw") ||
    combinedText.includes("megaslam") ||
    combinedText.includes("mega slam")
  ) {
    // Wrestling: 14:00–16:00
    defaultStart.setHours(14, 0, 0, 0);
    defaultEnd.setHours(16, 0, 0, 0);
  } else if (combinedText.includes("reindeer")) {
    // Reindeer: 12:00–16:00
    defaultStart.setHours(12, 0, 0, 0);
    defaultEnd.setHours(16, 0, 0, 0);
  } else {
    // Default: 19:30–23:30
    defaultStart.setHours(19, 30, 0, 0);
    defaultEnd.setHours(23, 30, 0, 0);
  }

  form.setValue("performance_range", {
    from: defaultStart,
    to: defaultEnd,
  });
}, [form.watch("artist_id"), form.watch("notes"), artists]);
