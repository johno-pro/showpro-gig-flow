import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const departmentFormSchema = z.object({
  name: z.string().trim().max(100, "Name must be less than 100 characters").optional(),
  client_id: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormProps {
  departmentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DepartmentForm({ departmentId, onSuccess, onCancel }: DepartmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      client_id: "",
    },
  });

  const { saveDraft, completeSave, draftStatus } = useFormDraft({
    table: "departments",
    form,
  });

  useEffect(() => {
    fetchClients();
    if (departmentId) {
      fetchDepartment();
    }
  }, [departmentId]);

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

  const fetchDepartment = async () => {
    if (!departmentId) return;

    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("id", departmentId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        form.reset({
          name: data.name,
          client_id: data.client_id || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load department");
      console.error(error);
    }
  };

  const onSubmit = async (values: DepartmentFormValues) => {
    setLoading(true);
    try {
      const departmentData = {
        name: values.name?.trim() || "",
        client_id: values.client_id || "",
      };

      await completeSave(departmentData);
      toast.success(departmentId ? "Department updated successfully" : "Department created successfully");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save department");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DraftIndicator status={draftStatus} />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Entertainment, Events, Marketing" {...field} value={field.value || ""} onBlur={() => { field.onBlur(); saveDraft(); }} />
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
              <FormLabel>Client</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); saveDraft(); }} value={field.value}>
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

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : departmentId ? "Update Department" : "Create Department"}
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
