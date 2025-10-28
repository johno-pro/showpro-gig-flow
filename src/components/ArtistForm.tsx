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

const artistFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  act_type: z.string().optional(),
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

  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: "",
      act_type: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (artistId) {
      fetchArtist();
    }
  }, [artistId]);

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
          act_type: data.act_type || "",
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
        act_type: values.act_type || null,
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
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Artist or act name" {...field} />
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
                <FormLabel>Phone</FormLabel>
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
