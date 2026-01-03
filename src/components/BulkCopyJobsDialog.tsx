import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Copy } from "lucide-react";

interface BulkCopyJobsDialogProps {
  bookings: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkCopyJobsDialog({ bookings, open, onOpenChange, onSuccess }: BulkCopyJobsDialogProps) {
  const [copying, setCopying] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newDate, setNewDate] = useState("");

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === bookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bookings.map(b => b.id)));
    }
  };

  const handleCopy = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one booking to copy");
      return;
    }
    if (!newDate) {
      toast.error("Please select a date for the copied bookings");
      return;
    }

    setCopying(true);
    try {
      const selectedBookings = bookings.filter(b => selectedIds.has(b.id));
      
      const newBookings = await Promise.all(
        selectedBookings.map(async (booking) => {
          // Fetch full booking data
          const { data: fullBooking } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", booking.id)
            .single();

          if (!fullBooking) return null;

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
          } = fullBooking;

          return {
            ...bookingData,
            booking_date: newDate,
            start_date: newDate,
            finish_date: newDate,
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
        })
      );

      const validBookings = newBookings.filter(Boolean);

      const { error } = await supabase
        .from("bookings")
        .insert(validBookings);

      if (error) throw error;

      toast.success(`${validBookings.length} booking(s) copied successfully`);
      setSelectedIds(new Set());
      setNewDate("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to copy bookings");
      console.error(error);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Bulk Copy Jobs
          </DialogTitle>
          <DialogDescription>
            Select bookings to copy to a new date. All selected bookings will be duplicated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-copy-date">New Date for All Copies *</Label>
            <Input
              id="bulk-copy-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Bookings ({selectedIds.size} selected)</Label>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedIds.size === bookings.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <ScrollArea className="h-64 rounded-md border">
              <div className="p-4 space-y-2">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => toggleSelection(booking.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(booking.id)}
                      onCheckedChange={() => toggleSelection(booking.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {booking.artists?.name || "No artist"} - {booking.clients?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.booking_date).toLocaleDateString()} • {booking.locations?.name || "No location"}
                      </p>
                    </div>
                    {booking.job_code && (
                      <code className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {booking.job_code}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={copying}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={copying || selectedIds.size === 0}>
            {copying ? "Copying..." : `Copy ${selectedIds.size} Booking(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
