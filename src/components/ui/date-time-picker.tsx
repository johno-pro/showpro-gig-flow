import React from "react";
import { Popover } from "@headlessui/react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

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
  // Ensure local safe default
  const safeDate = value ? new Date(value) : new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = ["00", "15", "30", "45", "59"];

  const handleTimeChange = (type: "hour" | "minute", newVal: string) => {
    const updated = new Date(safeDate);
    if (type === "hour") updated.setHours(Number(newVal));
    if (type === "minute") updated.setMinutes(Number(newVal));
    updated.setSeconds(0);
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      <label className="font-medium text-sm">{label}</label>
      <div className="flex items-center gap-3">
        {/* DATE POPUP */}
        <Popover className="relative">
          <Popover.Button className="border rounded-md px-3 py-2 bg-white text-left cursor-pointer w-40 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {safeDate.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Popover.Button>
          <Popover.Panel className="absolute z-50 bg-white shadow-lg p-3 rounded-md mt-2">
            <DayPicker
              mode="single"
              selected={safeDate}
              onSelect={(d) => {
                if (!d) return;
                const updated = new Date(safeDate);
                updated.setFullYear(d.getFullYear());
                updated.setMonth(d.getMonth());
                updated.setDate(d.getDate());
                onChange(updated);
              }}
            />
          </Popover.Panel>
        </Popover>
        {/* TIME SELECTORS */}
        <select
          className="border rounded-md px-2 py-2 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500"
          value={safeDate.getHours()}
          onChange={(e) => handleTimeChange("hour", e.target.value)}
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          className="border rounded-md px-2 py-2 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500"
          value={String(safeDate.getMinutes()).padStart(2, "0")}
          onChange={(e) => handleTimeChange("minute", e.target.value)}
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
