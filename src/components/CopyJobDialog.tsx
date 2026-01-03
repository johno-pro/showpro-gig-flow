import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy } from "lucide-react";

interface CopyJobDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newBookingId: string) => void;
}

export function CopyJobDialog({ booking, open, onOpenChange, onSuccess }: CopyJobDialogProps) {
  const [copying, setCopying] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newLocationId, setNewLocationId] = useState<string>("");
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    if (open && booking?.client_id) {
      fetchLocations();
      // Set default date to booking date
      setNewDate(booking.booking_date || booking.start_date || "");
      setNewLocationId(booking.location_id || "");
    }
  }, [open, booking]);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .eq("client_id", booking.client_id)
      .eq("status", "active")
      .order("name");
    
    if (data) setLocations(data);
  };

  const handleCopy = async () => {
    if (!newDate) {
      toast.error("Please select a date");
      return;
    }

    setCopying(true);
    try {
      // Create a copy of the booking with new date and location
      const { 
        id, 
        created_at, 
        updated_at, 
        job_code,
        invoiced,
        invoice_sent,
        invoice_status,
        deposit_paid,
        balance_paid,
        client_paid,
        artist_paid,
        remittance_received,
        remittance_date,
        ...bookingData 
      } = booking;

      // Remove nested relation data
      delete bookingData.artists;
      delete bookingData.clients;
      delete bookingData.venues;
      delete bookingData.locations;

      const newBooking = {
        ...bookingData,
        booking_date: newDate,
        start_date: newDate,
        finish_date: newDate,
        location_id: newLocationId || null,
        status: "enquiry" as const,
        artist_status: "enquiry" as const,
        client_status: "enquiry" as const,
        invoiced: false,
        invoice_sent: false,
        invoice_status: "uninvoiced",
        deposit_paid: false,
        balance_paid: false,
        client_paid: false,
        artist_paid: false,
        remittance_received: false,
        remittance_date: null,
      };

      const { data, error } = await supabase
        .from("bookings")
        .insert(newBooking)
        .select()
        .single();

      if (error) throw error;

      toast.success("Job copied successfully");
      onOpenChange(false);
      onSuccess(data.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to copy job");
      console.error(error);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copy Job
          </DialogTitle>
          <DialogDescription>
            Create a copy of this booking with a new date and optionally a different location.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="copy-date">New Date *</Label>
            <Input
              id="copy-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="copy-location">Location</Label>
            <Select value={newLocationId} onValueChange={setNewLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select location (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No location</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium mb-1">Will copy:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Artist: {booking?.artists?.name || "None"}</li>
              <li>Client: {booking?.clients?.name}</li>
              <li>Fees and financial settings</li>
              <li>Times and notes</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              Status will be reset to "Enquiry" and payment flags cleared.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={copying}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={copying}>
            {copying ? "Copying..." : "Copy Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
