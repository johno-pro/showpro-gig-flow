import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DateTimePickerProps = {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
}) => {
  const safeDate = value ? new Date(value) : new Date();
  const [open, setOpen] = React.useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45", "59"];

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const updated = new Date(safeDate);
    updated.setFullYear(date.getFullYear());
    updated.setMonth(date.getMonth());
    updated.setDate(date.getDate());
    onChange(updated);
    setOpen(false);
  };

  const handleTimeChange = (type: "hour" | "minute", newVal: string) => {
    const updated = new Date(safeDate);
    if (type === "hour") updated.setHours(Number(newVal));
    if (type === "minute") updated.setMinutes(Number(newVal));
    updated.setSeconds(0);
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              {format(safeDate, "EEE dd MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={safeDate}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Select
          value={String(safeDate.getHours()).padStart(2, "0")}
          onValueChange={(val) => handleTimeChange("hour", val)}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hours.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(safeDate.getMinutes()).padStart(2, "0")}
          onValueChange={(val) => handleTimeChange("minute", val)}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
