import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface FieldMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csvHeaders: string[];
  tableColumns: string[];
  tableName: string;
  onConfirm: (mapping: Record<string, string>) => void;
}

export function FieldMappingDialog({
  open,
  onOpenChange,
  csvHeaders,
  tableColumns,
  tableName,
  onConfirm,
}: FieldMappingDialogProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [autoMapped, setAutoMapped] = useState(0);

  useEffect(() => {
    if (open && csvHeaders.length > 0) {
      // Auto-map columns with exact or similar names
      const initialMapping: Record<string, string> = {};
      let autoCount = 0;

      csvHeaders.forEach((csvHeader) => {
        const normalizedCsvHeader = csvHeader.toLowerCase().trim().replace(/[_\s-]/g, "");
        
        // Try exact match first
        const exactMatch = tableColumns.find(
          (col) => col.toLowerCase() === csvHeader.toLowerCase()
        );
        
        if (exactMatch) {
          initialMapping[csvHeader] = exactMatch;
          autoCount++;
          return;
        }

        // Try normalized match
        const normalizedMatch = tableColumns.find(
          (col) => col.toLowerCase().replace(/[_\s-]/g, "") === normalizedCsvHeader
        );
        
        if (normalizedMatch) {
          initialMapping[csvHeader] = normalizedMatch;
          autoCount++;
          return;
        }

        // Try partial match (csv header contains table column or vice versa)
        const partialMatch = tableColumns.find((col) => {
          const normalizedCol = col.toLowerCase().replace(/[_\s-]/g, "");
          return (
            normalizedCsvHeader.includes(normalizedCol) ||
            normalizedCol.includes(normalizedCsvHeader)
          );
        });

        if (partialMatch) {
          initialMapping[csvHeader] = partialMatch;
          autoCount++;
        }
      });

      setMapping(initialMapping);
      setAutoMapped(autoCount);
    }
  }, [open, csvHeaders, tableColumns]);

  const handleMappingChange = (csvHeader: string, tableColumn: string) => {
    setMapping((prev) => ({
      ...prev,
      [csvHeader]: tableColumn === "skip" ? "" : tableColumn,
    }));
  };

  const handleConfirm = () => {
    // Filter out unmapped fields
    const finalMapping = Object.entries(mapping).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    onConfirm(finalMapping);
  };

  const mappedCount = Object.values(mapping).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Map CSV Fields to {tableName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                Auto-mapped {autoMapped} of {csvHeaders.length} fields
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {mappedCount}/{csvHeaders.length} mapped
            </span>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {csvHeaders.map((csvHeader, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">CSV Column</Label>
                    <div className="font-mono text-sm font-medium break-all">
                      {csvHeader}
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Database Field</Label>
                    <Select
                      value={mapping[csvHeader] || "skip"}
                      onValueChange={(value) => handleMappingChange(csvHeader, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">
                          <span className="text-muted-foreground italic">Skip this field</span>
                        </SelectItem>
                        {tableColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Unmapped fields will be skipped during import. Make sure all required
              fields are mapped correctly.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={mappedCount === 0}>
            Continue Import ({mappedCount} fields)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
