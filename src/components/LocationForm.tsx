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

const locationFormSchema = z.object({
  name: z.string().optional(),
  client_id: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  ents_contact_name: z.string().optional(),
  ents_contact_mobile: z.string().optional(),
  ents_contact_email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
  locationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LocationForm({ locationId, onSuccess, onCancel }: LocationFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      client_id: "",
      address: "",
      postcode: "",
      phone: "",
      email: "",
      ents_contact_name: "",
      ents_contact_mobile: "",
      ents_contact_email: "",
      notes: "",
    },
  });

  const { saveDraft, completeSave, draftStatus, draftId } = useFormDraft({
    table: "locations",
    formId: locationId,
    form,
  });

  const {
    contacts,
    selectedContactIds,
    setSelectedContactIds,
    saveEntityContacts,
  } = useEntityContacts("location", locationId);

  useEffect(() => {
    fetchClients();
    if (locationId) {
      fetchLocation();
    }
  }, [locationId]);

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
      console.error(error);
    }
  };

  const fetchLocation = async () => {
    if (!locationId) return;

    try {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("id", locationId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        form.reset({
          name: data.name,
          client_id: data.client_id || "",
          address: data.address || "",
          postcode: data.postcode || "",
          phone: data.phone || "",
          email: data.email || "",
          ents_contact_name: data.ents_contact_name || "",
          ents_contact_mobile: data.ents_contact_mobile || "",
          ents_contact_email: data.ents_contact_email || "",
          notes: data.notes || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load location");
      console.error(error);
    }
  };

  const onSubmit = async (values: LocationFormValues) => {
    setLoading(true);
    try {
      const savedData = await completeSave(values);
      const locationIdToUse = locationId || (savedData as any)?.id || draftId;
      
      if (locationIdToUse && selectedContactIds.length > 0) {
        await saveEntityContacts(locationIdToUse, selectedContactIds);
      }
      
      toast.success(locationId ? "Location updated successfully" : "Location created successfully");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save location");
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
                  <Input placeholder="Location name" {...field} onBlur={() => { field.onBlur(); saveDraft(); }} />
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
                <Select onValueChange={(value) => { field.onChange(value); setSelectedClient(value); saveDraft(); }} value={field.value}>
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
            name="postcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postcode</FormLabel>
                <FormControl>
                  <Input placeholder="Postcode" {...field} onBlur={() => { field.onBlur(); saveDraft(); }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field}) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} onBlur={() => { field.onBlur(); saveDraft(); }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} onBlur={() => { field.onBlur(); saveDraft(); }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Entertainment Contact</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="ents_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ents Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Entertainment contact name" {...field} onBlur={() => { field.onBlur(); saveDraft(); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ents_contact_mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ents Contact Mobile</FormLabel>
                  <FormControl>
                    <Input placeholder="Mobile number" {...field} onBlur={() => { field.onBlur(); saveDraft(); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ents_contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ents Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ents@example.com" {...field} onBlur={() => { field.onBlur(); saveDraft(); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Full address" className="min-h-[80px]" {...field} onBlur={() => { field.onBlur(); saveDraft(); }} />
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
            {loading ? "Saving..." : locationId ? "Update Location" : "Create Location"}
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
