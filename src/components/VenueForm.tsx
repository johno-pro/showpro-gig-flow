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
import { toast } from "sonner";

const venueFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  park_id: z.string().min(1, "Park is required"),
  capacity: z.string().optional(),
  notes: z.string().optional(),
});

type VenueFormValues = z.infer<typeof venueFormSchema>;

interface VenueFormProps {
  venueId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VenueForm({ venueId, onSuccess, onCancel }: VenueFormProps) {
  const [loading, setLoading] = useState(false);
  const [parks, setParks] = useState<any[]>([]);

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      name: "",
      park_id: "",
      capacity: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchParks();
    if (venueId) {
      fetchVenue();
    }
  }, [venueId]);

  const fetchParks = async () => {
    try {
      const { data, error } = await supabase
        .from("parks")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setParks(data || []);
    } catch (error) {
      toast.error("Failed to load parks");
      console.error(error);
    }
  };

  const fetchVenue = async () => {
    if (!venueId) return;

    try {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("id", venueId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        form.reset({
          name: data.name,
          park_id: data.park_id || "",
          capacity: data.capacity?.toString() || "",
          notes: data.notes || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load venue");
      console.error(error);
    }
  };

  const onSubmit = async (values: VenueFormValues) => {
    setLoading(true);
    try {
      const venueData = {
        name: values.name,
        park_id: values.park_id,
        capacity: values.capacity ? parseInt(values.capacity) : null,
        notes: values.notes || null,
      };

      if (venueId) {
        const { error } = await supabase
          .from("venues")
          .update(venueData)
          .eq("id", venueId);

        if (error) throw error;
        toast.success("Venue updated successfully");
      } else {
        const { error } = await supabase.from("venues").insert([venueData]);

        if (error) throw error;
        toast.success("Venue created successfully");
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save venue");
      console.error(error);
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Venue name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="park_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Park *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select park" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {parks.map((park) => (
                      <SelectItem key={park.id} value={park.id}>
                        {park.name}
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
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Maximum capacity" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : venueId ? "Update Venue" : "Create Venue"}
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
