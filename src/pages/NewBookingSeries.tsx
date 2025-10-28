import { BookingSeriesForm } from "@/components/BookingSeriesForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function NewBookingSeries() {
  const navigate = useNavigate();

  const createBookingSeries = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("booking_series").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking series created successfully");
      navigate("/booking-series");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Booking Series</h1>

      <Card>
        <CardHeader>
          <CardTitle>Booking Series Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingSeriesForm
            onSubmit={(data) => createBookingSeries.mutate(data)}
            isSubmitting={createBookingSeries.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
