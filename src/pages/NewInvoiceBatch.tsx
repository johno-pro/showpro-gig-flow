import { InvoiceBatchForm } from "@/components/InvoiceBatchForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function NewInvoiceBatch() {
  const navigate = useNavigate();

  const createInvoiceBatch = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("invoice_batches").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice batch created successfully");
      navigate("/invoice-batches");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Invoice Batch</h1>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Batch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceBatchForm
            onSubmit={(data) => createInvoiceBatch.mutate(data)}
            isSubmitting={createInvoiceBatch.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
