import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const bookingFormSchema = z.object({
  booking_date: z.string().min(1, "Booking date is required"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  status: z.enum(["enquiry", "pencil", "confirmed", "cancelled"]),
  client_id: z.string().min(1, "Client is required"),
  location_id: z.string().optional(),
  venue_id: z.string().optional(),
  artist_id: z.string().optional(),
  fee_model: z.enum(["commission", "buy_sell"]),
  artist_fee: z.string().optional(),
  client_fee: z.string().optional(),
  commission_rate: z.string().optional(),
  vat_applicable: z.boolean(),
  deposit_amount: z.string().optional(),
  deposit_paid: z.boolean(),
  balance_paid: z.boolean(),
  invoiced: z.boolean(),
  arrival_time: z.string().optional(),
  performance_times: z.string().optional(),
  confirmation_link: z.string().optional(),
  invoice_status: z.string().optional(),
  placeholder: z.boolean(),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  bookingId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BookingForm({ bookingId, onSuccess, onCancel }: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      booking_date: new Date().toISOString().split('T')[0],
      start_time: "19:00",
      end_time: "23:59",
      status: "enquiry",
      fee_model: "commission",
      vat_applicable: true,
      deposit_paid: false,
      balance_paid: false,
      invoiced: false,
      arrival_time: "",
      performance_times: "",
      confirmation_link: "",
      invoice_status: "uninvoiced",
      placeholder: false,
    },
  });

  useEffect(() => {
    fetchFormData();
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  useEffect(() => {
    if (selectedClient) {
      fetchLocations(selectedClient);
    }
  }, [selectedClient]);

  const fetchFormData = async () => {
    try {
      const [artistsRes, clientsRes] = await Promise.all([
        supabase.from("artists").select("id, name").order("name"),
        supabase.from("clients").select("id, name").order("name"),
      ]);

      if (artistsRes.error) throw artistsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setArtists(artistsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      toast.error("Failed to load form data");
    }
  };

  const fetchLocations = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .eq("client_id", clientId)
        .order("name");

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      toast.error("Failed to load locations");
    }
  };

  const fetchVenues = async (locationId: string) => {
    try {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name")
        .eq("location_id", locationId)
        .order("name");

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      toast.error("Failed to load venues");
    }
  };

  const fetchArtistLastBooking = async (artistId: string) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("artist_fee, vat_applicable, deposit_amount, client_fee")
        .eq("artist_id", artistId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Auto-fill fields from most recent booking
        form.setValue("artist_fee", data.artist_fee?.toString() || "");
        form.setValue("vat_applicable", data.vat_applicable ?? true);
        form.setValue("deposit_amount", data.deposit_amount?.toString() || "");
        form.setValue("client_fee", data.client_fee?.toString() || "");
      }
    } catch (error) {
      // Error fetching artist's last booking - continue without auto-fill
    }
  };

  const fetchBooking = async () => {
    if (!bookingId) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          booking_date: data.booking_date,
          start_time: data.start_time || "",
          end_time: data.end_time || "",
          status: data.status,
          client_id: data.client_id,
          location_id: data.location_id || "",
          venue_id: data.venue_id || "",
          artist_id: data.artist_id || "",
          fee_model: data.fee_model,
          artist_fee: data.artist_fee?.toString() || "",
          client_fee: data.client_fee?.toString() || "",
          commission_rate: data.commission_rate?.toString() || "",
          vat_applicable: data.vat_applicable,
          deposit_amount: data.deposit_amount?.toString() || "",
          deposit_paid: data.deposit_paid,
          balance_paid: data.balance_paid,
          invoiced: data.invoiced,
          arrival_time: data.arrival_time || "",
          performance_times: data.performance_times || "",
          confirmation_link: data.confirmation_link || "",
          invoice_status: data.invoice_status || "uninvoiced",
          placeholder: data.placeholder || false,
          notes: data.notes || "",
        });

        setSelectedClient(data.client_id);
        if (data.location_id) {
          fetchVenues(data.location_id);
        }
      }
    } catch (error) {
      toast.error("Failed to load booking");
    }
  };

  const onSubmit = async (values: BookingFormValues) => {
    setLoading(true);
    try {
      const bookingData = {
        booking_date: values.booking_date,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
        status: values.status,
        client_id: values.client_id,
        location_id: values.location_id || null,
        venue_id: values.venue_id || null,
        artist_id: values.artist_id || null,
        fee_model: values.fee_model,
        artist_fee: values.artist_fee ? parseFloat(values.artist_fee) : null,
        client_fee: values.client_fee ? parseFloat(values.client_fee) : null,
        commission_rate: values.commission_rate ? parseFloat(values.commission_rate) : null,
        deposit_amount: values.deposit_amount ? parseFloat(values.deposit_amount) : null,
        vat_applicable: values.vat_applicable,
        deposit_paid: values.deposit_paid,
        balance_paid: values.balance_paid,
        invoiced: values.invoiced,
        arrival_time: values.arrival_time || null,
        performance_times: values.performance_times || null,
        confirmation_link: values.confirmation_link || null,
        invoice_status: values.invoice_status || "uninvoiced",
        placeholder: values.placeholder,
        notes: values.notes || null,
      };

      if (bookingId) {
        const { error } = await supabase
          .from("bookings")
          .update(bookingData)
          .eq("id", bookingId);

        if (error) throw error;
        toast.success("Booking updated successfully");
      } else {
        const { error } = await supabase.from("bookings").insert([bookingData]);

        if (error) throw error;
        toast.success("Booking created successfully");
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error("Failed to save booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="booking_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Booking Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="enquiry">Enquiry</SelectItem>
                    <SelectItem value="pencil">Pencil</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
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
                <FormLabel>Client *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedClient(value);
                    form.setValue("location_id", "");
                    form.setValue("venue_id", "");
                    setVenues([]);
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

          <FormField
            control={form.control}
            name="location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    fetchVenues(value);
                    form.setValue("venue_id", "");
                  }}
                  value={field.value}
                  disabled={!selectedClient}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!form.watch("location_id")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
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
            name="artist_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Artist</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value && !bookingId) {
                      fetchArtistLastBooking(value);
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select artist" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {artists.map((artist) => (
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
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Financial Details</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fee_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="commission">Commission</SelectItem>
                      <SelectItem value="buy_sell">Buy/Sell</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="15.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="artist_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist Fee (£)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Fee (£)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deposit_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Amount (£)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="vat_applicable"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>VAT Applicable</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deposit_paid"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Deposit Paid</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="balance_paid"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Balance Paid</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiced"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Invoiced</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="placeholder"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Placeholder (Red Hold)</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Details</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="arrival_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arrival Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="performance_times"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Performance Times</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 8:00pm - 11:00pm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoice_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="uninvoiced">Uninvoiced</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmation_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmation Link</FormLabel>
                  <FormControl>
                    <Input placeholder="URL to confirmation email/form" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Add any additional notes..." className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : bookingId ? "Update Booking" : "Create Booking"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
