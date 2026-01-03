import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";

interface QuickEditFieldProps {
  bookingId: string;
  field: string;
  value: any;
  displayValue: string;
  type: "date" | "select" | "currency";
  options?: { id: string; name: string }[];
  onUpdate: () => void;
}

export function QuickEditField({
  bookingId,
  field,
  value,
  displayValue,
  type,
  options = [],
  onUpdate,
}: QuickEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let updateData: any = { [field]: editValue || null };

      // If updating booking_date, also update start_date and finish_date
      if (field === "booking_date") {
        updateData.start_date = editValue;
        updateData.finish_date = editValue;
      }

      const { error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Updated successfully");
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="group flex items-center gap-2">
        <span>{displayValue}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (type === "date") {
    return (
      <div className="flex items-center gap-2">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !editValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {editValue ? format(new Date(editValue), "PPP") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={editValue ? new Date(editValue) : undefined}
              onSelect={(date) => {
                if (date) {
                  setEditValue(format(date, "yyyy-MM-dd"));
                }
                setCalendarOpen(false);
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel} disabled={saving}>
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className="flex items-center gap-2">
        <Select value={editValue || ""} onValueChange={setEditValue}>
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel} disabled={saving}>
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  }

  if (type === "currency") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <span className="text-muted-foreground mr-1">£</span>
          <Input
            type="number"
            step="0.01"
            value={editValue || ""}
            onChange={(e) => setEditValue(e.target.value ? parseFloat(e.target.value) : null)}
            className="w-24 h-8"
          />
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel} disabled={saving}>
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  }

  return null;
}
