import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CompanySettings {
  id: string;
  company_name: string;
  registered_address: string | null;
  company_number: string | null;
  vat_number: string | null;
  accounts_email: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_sort_code: string | null;
  bank_account_number: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<CompanySettings>) => {
      // First get the existing settings ID
      const { data: existing } = await supabase
        .from("company_settings")
        .select("id")
        .limit(1)
        .single();

      if (!existing) {
        throw new Error("No company settings found");
      }

      const { data, error } = await supabase
        .from("company_settings")
        .update(settings)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update company settings",
        variant: "destructive",
      });
      console.error("Error updating company settings:", error);
    },
  });
}
