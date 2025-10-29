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
import { toast } from "sonner";

const supplierFormSchema = z.object({
  name: z.string().trim().min(1, "Company/Supplier name is required").max(100, "Name must be less than 100 characters"),
  address: z.string().trim().max(500, "Address must be less than 500 characters").optional(),
  company_number: z.string().trim().max(50, "Company number must be less than 50 characters").optional(),
  vat_number: z.string().trim().max(50, "VAT number must be less than 50 characters").optional(),
  contact_name: z.string().trim().max(100, "Contact name must be less than 100 characters").optional(),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  accounts_contact_name: z.string().trim().max(100, "Accounts contact name must be less than 100 characters").optional(),
  accounts_contact_email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  accounts_contact_phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  notes: z.string().trim().max(1000, "Notes must be less than 1000 characters").optional(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface SupplierFormProps {
  supplierId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SupplierForm({ supplierId, onSuccess, onCancel }: SupplierFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      address: "",
      company_number: "",
      vat_number: "",
      contact_name: "",
      email: "",
      phone: "",
      accounts_contact_name: "",
      accounts_contact_email: "",
      accounts_contact_phone: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId]);

  const fetchSupplier = async () => {
    if (!supplierId) return;

    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", supplierId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        form.reset({
          name: data.name,
          address: data.address || "",
          company_number: data.company_number || "",
          vat_number: data.vat_number || "",
          contact_name: data.contact_name || "",
          email: data.email || "",
          phone: data.phone || "",
          accounts_contact_name: data.accounts_contact_name || "",
          accounts_contact_email: data.accounts_contact_email || "",
          accounts_contact_phone: data.accounts_contact_phone || "",
          notes: data.notes || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load supplier");
      console.error(error);
    }
  };

  const onSubmit = async (values: SupplierFormValues) => {
    setLoading(true);
    try {
      const supplierData = {
        name: values.name.trim(),
        address: values.address?.trim() || null,
        company_number: values.company_number?.trim() || null,
        vat_number: values.vat_number?.trim() || null,
        contact_name: values.contact_name?.trim() || null,
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        accounts_contact_name: values.accounts_contact_name?.trim() || null,
        accounts_contact_email: values.accounts_contact_email?.trim() || null,
        accounts_contact_phone: values.accounts_contact_phone?.trim() || null,
        notes: values.notes?.trim() || null,
      };

      if (supplierId) {
        const { error } = await supabase
          .from("suppliers")
          .update(supplierData)
          .eq("id", supplierId);

        if (error) throw error;
        toast.success("Supplier updated successfully");
      } else {
        const { error } = await supabase.from("suppliers").insert([supplierData]);

        if (error) throw error;
        toast.success("Supplier created successfully");
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save supplier");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Company Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company / Supplier Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Company or supplier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Company registration number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vat_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT Number</FormLabel>
                  <FormControl>
                    <Input placeholder="VAT registration number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="Full company address" className="min-h-[80px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Main Contact</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Primary contact person" {...field} />
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
                  <FormLabel>Main Contact Email</FormLabel>
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
                  <FormLabel>Main Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Accounts Contact</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="accounts_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accounts Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Accounts contact person" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accounts_contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accounts Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="accounts@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accounts_contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accounts Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Accounts phone number" {...field} />
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
            {loading ? "Saving..." : supplierId ? "Update Supplier" : "Create Supplier"}
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
