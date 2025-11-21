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
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/ui/draft-indicator";
import { MultiSelect } from "@/components/ui/multi-select";
import { useEntityContacts } from "@/hooks/useEntityContacts";

const venueFormSchema = z.object({
  name: z.string().optional(),
  park_id: z.string().optional(),
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
  const [locations, setLocations] = useState<any[]>([]);

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      name: "",
      park_id: "",
      capacity: "",
      notes: "",
    },
  });

  const { saveDraft, completeSave, draftStatus } = useFormDraft({
    table: "venues",
    form,
  });

  const {
    contacts,
    selectedContactIds,
    setSelectedContactIds,
    saveEntityContacts,
  } = useEntityContacts("venue", venueId);

  useEffect(() => {
    fetchLocations();
    if (venueId) {
      fetchVenue();
    }
  }, [venueId]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      toast.error("Failed to load locations");
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
          park_id: data.location_id || "",
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
      const savedData = await completeSave(values);
      const venueIdToUse = venueId || (savedData as any)?.id;
      
      if (venueIdToUse && selectedContactIds.length > 0) {
        await saveEntityContacts(venueIdToUse, selectedContactIds);
      }
      
      toast.success(venueId ? "Venue updated successfully" : "Venue created successfully");
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
        <DraftIndicator status={draftStatus} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Venue name" {...field} onBlur={() => { field.onBlur(); saveDraft(); }} />
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
              <FormLabel>Location *</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); saveDraft(); }} value={field.value}>
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
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Maximum capacity" {...field} onBlur={() => { field.onBlur(); saveDraft(); }} />
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
                  onBlur={() => { field.onBlur(); saveDraft(); }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Contacts</FormLabel>
          <MultiSelect
            options={contacts.map(c => ({ value: c.id, label: c.name }))}
            selected={selectedContactIds}
            onChange={setSelectedContactIds}
            placeholder="Select contacts..."
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : venueId ? "Update Venue" : "Create Venue"}
          </Button>
          <Button type="button" variant="outline" onClick={() => saveDraft()} disabled={loading}>
            Save Draft
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
