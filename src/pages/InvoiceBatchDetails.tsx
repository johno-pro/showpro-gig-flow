import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceBatchForm } from "@/components/InvoiceBatchForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function InvoiceBatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: batch, isLoading } = useQuery({
    queryKey: ["invoice_batch", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_batches")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateInvoiceBatch = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("invoice_batches")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice batch updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteInvoiceBatch = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoice_batches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice batch deleted successfully");
      navigate("/invoice-batches");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!batch) return <div>Invoice batch not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/invoice-batches")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold flex-1">Edit Invoice Batch</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice Batch</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this invoice batch? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteInvoiceBatch.mutate()}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Batch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceBatchForm
            defaultValues={{
              ...batch,
              total_amount: batch.total_amount?.toString() || "",
            }}
            onSubmit={(data) => updateInvoiceBatch.mutate(data)}
            isSubmitting={updateInvoiceBatch.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
