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
import { sanitizeText } from "@/lib/sanitize";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/ui/draft-indicator";

const contactFormSchema = z.object({
  name: z.string().trim().optional(),
  title: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  mobile: z.string().trim().optional(),
  client_id: z.string().optional(),
  location_id: z.string().optional(),
  department_id: z.string().optional(),
  supplier_id: z.string().optional(),
  notes: z.string().trim().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  contactId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContactForm({ contactId, onSuccess, onCancel }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      title: "",
      email: "",
      phone: "",
      mobile: "",
      client_id: "",
      location_id: "",
      department_id: "",
      supplier_id: "",
      notes: "",
    },
  });

  const { saveDraft, completeSave, draftStatus } = useFormDraft({
    table: "contacts",
    form,
  });

  useEffect(() => {
    fetchClients();
    fetchSuppliers();
    if (contactId) {
      fetchContact();
    }
  }, [contactId]);

  useEffect(() => {
    if (selectedClient) {
      fetchLocations(selectedClient);
      fetchDepartments(selectedClient);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error(error);
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
      console.error(error);
    }
  };

  const fetchDepartments = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .eq("client_id", clientId)
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchContact = async () => {
    if (!contactId) return;

    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        form.reset({
          name: data.name,
          title: data.title || "",
          email: data.email || "",
          phone: data.phone || "",
          mobile: data.mobile || "",
          client_id: data.client_id || "",
          location_id: data.location_id || "",
          department_id: data.department_id || "",
          supplier_id: data.supplier_id || "",
          notes: data.notes || "",
        });

        if (data.client_id) {
          setSelectedClient(data.client_id);
        }
      }
    } catch (error) {
      toast.error("Failed to load contact");
      console.error(error);
    }
  };

  const onSubmit = async (values: ContactFormValues) => {
    setLoading(true);
    try {
      const contactData = {
        name: sanitizeText(values.name, 100),
        title: values.title ? sanitizeText(values.title, 100) : null,
        email: values.email ? sanitizeText(values.email, 255) : null,
        phone: values.phone ? sanitizeText(values.phone, 20) : null,
        mobile: values.mobile ? sanitizeText(values.mobile, 20) : null,
        client_id: values.client_id || null,
        location_id: values.location_id || null,
        department_id: values.department_id || null,
        supplier_id: values.supplier_id || null,
        notes: values.notes ? sanitizeText(values.notes, 1000) : null,
      };

      await completeSave(contactData);
      toast.success(contactId ? "Contact updated successfully" : "Contact created successfully");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save contact");
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
                  <Input placeholder="Contact name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Job title" {...field} />
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
                  <Input type="email" placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile</FormLabel>
                <FormControl>
                  <Input placeholder="Mobile number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedClient(value);
                    form.setValue("location_id", "");
                    form.setValue("department_id", "");
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
                  onValueChange={field.onChange}
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
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedClient}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
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
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        <div className="flex items-center justify-between">
          <DraftIndicator status={draftStatus} />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => saveDraft()} disabled={loading}>
              Save Draft
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : contactId ? "Update Contact" : "Create Contact"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
