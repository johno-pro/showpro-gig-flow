import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookingSeriesForm } from "@/components/BookingSeriesForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function BookingSeriesDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: series, isLoading } = useQuery({
    queryKey: ["booking_series", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_series")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateBookingSeries = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("booking_series")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking series updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteBookingSeries = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("booking_series").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking series deleted successfully");
      navigate("/booking-series");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!series) return <div>Booking series not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/booking-series")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold flex-1">Edit Booking Series</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Booking Series</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this booking series? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteBookingSeries.mutate()}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Series Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingSeriesForm
            defaultValues={series}
            onSubmit={(data) => updateBookingSeries.mutate(data)}
            isSubmitting={updateBookingSeries.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
