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
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/DraftIndicator";

const bookingSchema = z
  .object({
    artist_id: z.string().optional(),
    venue_id: z.string().optional(),
    client_id: z.string().optional(),
    location_id: z.string().optional(),
    supplier_id: z.string().optional(),
    contact_id: z.string().optional(),
    arrival_time: z.date().optional(),
    performance_range: z.object({ from: z.date().optional(), to: z.date().optional() }).optional(),
    total_rate: z.number().optional(),
    split_ratio: z.number().min(0.5).max(0.95).default(0.85),
    notes: z.string().optional(),
    custom_artist: z.string().optional(),
    custom_venue: z.string().optional(),
    custom_client: z.string().optional(),
    custom_location: z.string().optional(),
    custom_supplier: z.string().optional(),
    custom_contact: z.string().optional(),
  })
  .refine((data) => data.artist_id || data.custom_artist, { message: "Artist required" });

type BookingFormData = z.infer<typeof bookingSchema>;

export function BookingForm({
  defaultValues,
  onSuccess,
}: {
  defaultValues?: Partial<BookingFormData>;
  onSuccess?: () => void;
}) {
  const [data, setData] = useState({
    venues: [],
    artists: [],
    clients: [],
    locations: [],
    suppliers: [],
    contacts: [],
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({ artist: 0, agency: 0 });
  const [modals, setModals] = useState({
    artist: false,
    client: false,
    venue: false,
    location: false,
    supplier: false,
    contact: false,
  });
  const [newIds, setNewIds] = useState({ artist: "", client: "", venue: "", location: "", supplier: "", contact: "" });

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

  const { draftStatus, saveDraft, completeSave } = useFormDraft({ table: "bookings", form });

  useEffect(() => {
    Promise.all([
      supabase.from("venues").select("id, name").order("name"),
      supabase.from("artists").select("id, name").order("name"),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("locations").select("id, name").order("name"),
      supabase.from("suppliers").select("id, name").order("name"),
      supabase.from("contacts").select("id, name").order("name"),
    ]).then(([venues, artists, clients, locations, suppliers, contacts]) => {
      setData({
        venues: venues.data || [],
        artists: artists.data || [],
        clients: clients.data || [],
        locations: locations.data || [],
        suppliers: suppliers.data || [],
        contacts: contacts.data || [],
      });
    });
  }, []);

  useEffect(() => {
    const { split_ratio, total_rate } = form.watch();
    setPreview({ artist: total_rate * split_ratio, agency: total_rate * (1 - split_ratio) });
  }, [form.watch("split_ratio"), form.watch("total_rate")]);

  const openModal = (key) => setModals((prev) => ({ ...prev, [key]: true }));
  const closeModal = (key) => setModals((prev) => ({ ...prev, [key]: false }));
  const setNewId = (key, id) => {
    setNewIds((prev) => ({ ...prev, [key]: id }));
    form.setValue(MODALS[key].formKey, id);
    closeModal(key);
    toast.success(`${MODALS[key].label} added!`);
    saveDraft(form.getValues());
  };

  const renderField = (key) => {
    const { formKey, customKey, label, dataKey } = MODALS[key];
    const items = data[dataKey];
    const value = form.watch(formKey);

    return (
      <FormItem className="mb-4">
        <FormLabel>{label}</FormLabel>
        <Select
          onValueChange={(v) => {
            form.setValue(formKey, v);
            if (v === "manual") form.setValue(customKey, "");
          }}
          value={value}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
            <SelectItem value="manual">Manual {label}</SelectItem>
          </SelectContent>
        </Select>
        {value === "manual" && (
          <Input
            className="mt-1"
            placeholder={`Custom ${label.toLowerCase()} name`}
            onChange={(e) => form.setValue(customKey, e.target.value)}
          />
        )}
        <Button type="button" variant="link" onClick={() => openModal(key)} className="p-0 h-auto mt-1">
          Add New {label}
        </Button>
        <FormMessage />
      </FormItem>
    );
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await completeSave(data);
      toast.success("Booking created!");
      onSuccess?.();
    } catch (err) {
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
          {renderField("artist")}
          {renderField("client")}
          {renderField("venue")}
          {renderField("location")}
          {renderField("supplier")}
          {renderField("contact")}
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
        <Button type="button" variant="outline" onClick={() => saveDraft(form.getValues())} disabled={saving}>
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={saving}>
          {saving ? "Creating..." : "Create Booking"}
        </Button>
      </div>
      <DraftIndicator status={draftStatus} />
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

      {/* Modals (Concise Loop) */}
      {Object.entries(MODALS).map(([key, config]) => (
        <Dialog key={key} open={modals[key]} onOpenChange={(open) => setModals((prev) => ({ ...prev, [key]: open }))}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New {config.label}</DialogTitle>
            </DialogHeader>
            <config.Form onSuccess={(id) => setNewId(key, id)} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModals((prev) => ({ ...prev, [key]: false }))}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </Form>
  );
}
