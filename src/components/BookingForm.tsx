import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { formatGBP } from "@/lib/utils";

const bookingSchema = z.object({
  artist_id: z.string().optional(),
  venue_id: z.string().optional(),
  client_id: z.string().optional(),
  arrival_time: z.date().optional(),
  performance_range: z.object({ from: z.date().optional(), to: z.date().optional() }).optional(),
  total_rate: z.number().optional(),
  split_ratio: z.number().min(0.5).max(0.95).default(0.85),
  notes: z.string().optional(),
  status: z.enum(["draft", "pending", "paid"]).default("draft"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function BookingForm({
  defaultValues,
  onSuccess,
}: {
  defaultValues?: Partial<BookingFormData>;
  onSuccess?: () => void;
}) {
  const [venues, setVenues] = useState([]);
  const [artists, setArtists] = useState([]);
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({ artist: 0, agency: 0 });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      arrival_time: new Date(new Date().setHours(18, 0, 0, 0)),
      performance_range: {
        from: new Date(new Date().setHours(19, 0, 0, 0)),
        to: new Date(new Date().setHours(23, 30, 0, 0)),
      },
      total_rate: 150,
      ...defaultValues,
    },
  });

  useEffect(() => {
    supabase
      .from("venues")
      .select("id, name")
      .order("name")
      .then(({ data }) => setVenues(data || []));
    supabase
      .from("artists")
      .select("id, name")
      .order("name")
      .then(({ data }) => setArtists(data || []));
    supabase
      .from("clients")
      .select("id, name")
      .order("name")
      .then(({ data }) => setClients(data || []));
  }, []);

  useEffect(() => {
    const { split_ratio, total_rate } = form.watch();
    setPreview({ artist: total_rate * split_ratio, agency: total_rate * (1 - split_ratio) });
  }, [form.watch("split_ratio"), form.watch("total_rate")]);

  const handleSaveDraft = async () => {
    setSaving(true);
    const values = form.getValues();
    
    const draftData = {
      artist_id: values.artist_id || null,
      venue_id: values.venue_id || null,
      client_id: values.client_id || null,
      notes: values.notes || null,
      status: 'enquiry' as const,
      booking_date: new Date().toISOString().split('T')[0],
    };
    
    const { error } = await supabase.from("bookings").insert(draftData);
    toast[error ? "error" : "success"](error ? "Draft failed" : "Auto-saved draft!");
    setSaving(false);
  };

  useEffect(() => {
    const sub = form.watch((value) => {
      if (Object.values(value).some((v) => v !== "" && v !== undefined)) {
        const timer = setTimeout(handleSaveDraft, 2000);
        return () => clearTimeout(timer);
      }
    });
    return () => sub.unsubscribe();
  }, [form.watch()]);

  const onSubmit = async (data: BookingFormData) => {
    setSaving(true);
    try {
      const bookingData = {
        artist_id: data.artist_id || null,
        venue_id: data.venue_id || null,
        client_id: data.client_id || null,
        notes: data.notes || null,
        status: 'enquiry' as const,
        booking_date: new Date().toISOString().split('T')[0],
      };

      const { error } = await supabase.from("bookings").insert(bookingData);
      if (error) throw error;
      toast.success("Booking created!");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Booking failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="times">Times</TabsTrigger>
          <TabsTrigger value="money">Money</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <FormField
            name="artist_id"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Artist</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select artist" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {artists.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="venue_id"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Venue</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {venues.map((v) => (
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
            name="client_id"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>
        <TabsContent value="times">
          <FormField
            name="arrival_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arrival (Default 6pm)</FormLabel>
                <FormControl>
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="performance_range"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Performance (Default 7pm-11:30pm)</FormLabel>
                <FormControl>
                  <Calendar mode="range" selected={field.value} onSelect={(range) => field.onChange(range)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>
        <TabsContent value="money">
          <FormField
            name="total_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rate (£)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g. 150" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="split_ratio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Split Ratio</FormLabel>
                <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={field.value.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="85/15" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.85">85/15</SelectItem>
                    <SelectItem value="0.80">80/20</SelectItem>
                    <SelectItem value="0.90">90/10</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>Artist: {formatGBP(preview.artist)}</p>
            <p>Agency: {formatGBP(preview.agency)}</p>
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex gap-3 mt-4">
        <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={saving}>
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={saving}>
          {saving ? "Creating..." : "Create Booking"}
        </Button>
      </div>
      <FormField
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Add notes..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}
