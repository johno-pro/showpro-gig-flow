import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInsertBookingMutation } from "@/integrations/supabase/hooks/bookings";
import { useArtistsQuery } from "@/integrations/supabase/hooks/artists";
import { useVenuesQuery } from "@/integrations/supabase/hooks/venues";
import { useClientsQuery } from "@/integrations/supabase/hooks/clients";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function BookingForm({
  defaultValues,
  onSuccess,
}: {
  defaultValues?: any;
  onSuccess?: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      status: "confirmed",
      booking_date: new Date(),
      ...defaultValues,
    },
  });

  const insertBooking = useInsertBookingMutation();
  const { data: artists } = useArtistsQuery();
  const { data: venues } = useVenuesQuery();
  const { data: clients } = useClientsQuery();

  const [saving, setSaving] = useState(false);

  const onSubmit = async (values) => {
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

