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

const artistFormSchema = z.object({
  name: z.string().min(1, "Professional name is required"),
  full_name: z.string().optional(),
  act_type: z.string().optional(),
  supplier_id: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type ArtistFormValues = z.infer<typeof artistFormSchema>;

interface ArtistFormProps {
  artistId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ArtistForm({ artistId, onSuccess, onCancel }: ArtistFormProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: "",
      full_name: "",
      act_type: "",
      supplier_id: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchSuppliers();
    if (artistId) {
      fetchArtist();
    }
  }, [artistId]);

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

  const fetchArtist = async () => {
    if (!artistId) return;

    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("id", artistId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        form.reset({
          name: data.name,
          full_name: data.full_name || "",
          act_type: data.act_type || "",
          supplier_id: data.supplier_id || "",
          email: data.email || "",
          phone: data.phone || "",
          notes: data.notes || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load artist");
      console.error(error);
    }
  };

  const onSubmit = async (values: ArtistFormValues) => {
    setLoading(true);
    try {
      const artistData = {
        name: values.name,
        full_name: values.full_name || null,
        act_type: values.act_type || null,
        supplier_id: values.supplier_id || null,
        email: values.email || null,
        phone: values.phone || null,
        notes: values.notes || null,
      };

      if (artistId) {
        const { error } = await supabase
          .from("artists")
          .update(artistData)
          .eq("id", artistId);

        if (error) throw error;
        toast.success("Artist updated successfully");
      } else {
        const { error } = await supabase.from("artists").insert([artistData]);

        if (error) throw error;
        toast.success("Artist created successfully");
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save artist");
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
                <FormLabel>Professional Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Stage or professional name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full legal name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="act_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Act Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Singer, Band, Comedian" {...field} />
                </FormControl>
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
                      <SelectValue placeholder="Select supplier (optional)" />
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

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="artist@example.com" {...field} />
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
                <FormLabel>Tel Number</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
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
                  placeholder="Add any additional notes about the artist..."
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
            {loading ? "Saving..." : artistId ? "Update Artist" : "Create Artist"}
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
