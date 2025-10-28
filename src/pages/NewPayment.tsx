import { PaymentForm } from "@/components/PaymentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function NewPayment() {
  const navigate = useNavigate();

  const createPayment = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("payments").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment created successfully");
      navigate("/payments");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Payment</h1>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForm
            onSubmit={(data) => createPayment.mutate(data)}
            isSubmitting={createPayment.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
