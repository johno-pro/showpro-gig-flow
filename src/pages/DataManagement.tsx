import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { FieldMappingDialog } from "@/components/FieldMappingDialog";

type TableName = "artists" | "clients" | "locations" | "venues" | "contacts" | "bookings" | "invoices" | "payments" | "suppliers" | "teams" | "departments" | "emails_queue";

interface TableConfig {
  name: TableName;
  label: string;
  columns: string[];
}

const TABLES: TableConfig[] = [
  {
    name: "artists",
    label: "Artists",
    columns: ["name", "act_type", "phone", "email", "buy_fee", "sell_fee", "vat_rate", "notes", "invoice_upload_url"]
  },
  {
    name: "clients",
    label: "Clients",
    columns: ["name", "code", "address", "contact_name", "contact_email", "contact_phone", "accounts_contact_name", "accounts_contact_email", "billing_address", "invoice_preferences", "notes"]
  },
  {
    name: "locations",
    label: "Locations",
    columns: ["name", "address", "postcode", "phone", "email", "ents_contact_name", "ents_contact_email", "ents_contact_mobile", "map_link_url", "notes"]
  },
  {
    name: "venues",
    label: "Venues",
    columns: ["name", "capacity", "notes"]
  },
  {
    name: "contacts",
    label: "Contacts",
    columns: ["name", "title", "email", "phone", "mobile", "notes"]
  },
  {
    name: "bookings",
    label: "Bookings",
    columns: ["booking_date", "start_date", "start_time", "finish_date", "finish_time", "arrival_time", "performance_times", "status", "artist_status", "client_status", "buy_fee", "sell_fee", "vat_in", "vat_out", "profit_percent", "confirmation_link", "invoice_status", "placeholder", "notes"]
  },
  {
    name: "invoices",
    label: "Invoices",
    columns: ["amount_due", "due_date", "status", "payment_link", "artist_payment_link"]
  },
  {
    name: "payments",
    label: "Payments",
    columns: ["amount", "payment_date", "payment_type", "method", "artist_portion", "notes"]
  },
  {
    name: "suppliers",
    label: "Suppliers",
    columns: ["name", "address", "phone", "email", "contact_name", "accounts_contact_name", "accounts_contact_email", "company_number", "vat_number", "notes"]
  },
  {
    name: "teams",
    label: "Teams",
    columns: ["name", "notes"]
  },
  {
    name: "departments",
    label: "Departments",
    columns: ["name"]
  },
  {
    name: "emails_queue",
    label: "Email Queue",
    columns: ["type", "email_subject", "email_body", "approved_to_send", "sent", "sent_at"]
  }
];

export default function DataManagement() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableName>("artists");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

  const convertToCSV = (data: any[], columns: string[]): string => {
    if (!data || data.length === 0) return "";

    // Header row
    const header = columns.join(",");
    
    // Data rows
    const rows = data.map(row => {
      return columns.map(col => {
        const value = row[col];
        
        // Handle null/undefined
        if (value === null || value === undefined) return "";
        
        // Handle dates
        if (value instanceof Date) return format(value, "yyyy-MM-dd");
        
        // Handle objects/arrays (stringify them)
        if (typeof value === "object") return JSON.stringify(value);
        
        // Handle strings with commas or quotes (escape them)
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(",");
    });

    return [header, ...rows].join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (table: TableConfig) => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error(`No data found in ${table.label}`);
        return;
      }

      const csv = convertToCSV(data, table.columns);
      const filename = `${table.name}_export_${format(new Date(), "yyyy-MM-dd_HHmmss")}.csv`;
      
      downloadCSV(csv, filename);
      toast.success(`Exported ${data.length} records from ${table.label}`);
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(`Failed to export ${table.label}: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      for (const table of TABLES) {
        await handleExport(table);
        // Small delay between exports
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      toast.success("All tables exported successfully");
    } catch (error: any) {
      toast.error("Failed to export all tables");
    } finally {
      setExporting(false);
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split("\n");
    const result: string[][] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const row: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          row.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      
      row.push(current.trim());
      result.push(row);
    }
    
    return result;
  };

  const handleStartImport = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }

    try {
      const text = await importFile.text();
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Store parsed data and show mapping dialog
      setCsvHeaders(headers);
      setCsvData(dataRows);
      setShowMappingDialog(true);
    } catch (error: any) {
      console.error("Parse error:", error);
      toast.error(`Failed to parse CSV: ${error.message}`);
    }
  };

  const handleConfirmMapping = (mapping: Record<string, string>) => {
    setFieldMapping(mapping);
    setShowMappingDialog(false);
    // Proceed with import
    performImport(mapping);
  };

  const performImport = async (mapping: Record<string, string>) => {
    setImporting(true);
    try {
      const dataRows = csvData;
      
      const tableConfig = TABLES.find(t => t.name === selectedTable);
      if (!tableConfig) {
        toast.error("Invalid table selected");
        return;
      }

      // Prepare data for insertion using the mapping
      const recordsToInsert = dataRows.map(row => {
        const record: any = {};
        csvHeaders.forEach((csvHeader, index) => {
          // Check if this CSV column is mapped to a database column
          const dbColumn = mapping[csvHeader];
          if (!dbColumn) return; // Skip unmapped columns

          const value = row[index];
          
          // Skip empty values
          if (value === "" || value === null || value === undefined) return;
          
          // Handle JSON fields
          if (dbColumn === "email_targets" || dbColumn === "recipients" || dbColumn === "attachments" || dbColumn === "upload_history") {
            try {
              record[dbColumn] = JSON.parse(value);
            } catch {
              record[dbColumn] = [];
            }
            return;
          }
          
          // Handle boolean fields
          if (dbColumn === "placeholder" || dbColumn === "approved_to_send" || dbColumn === "sent" || dbColumn === "vat_applicable" || dbColumn === "deposit_paid" || dbColumn === "balance_paid" || dbColumn === "invoiced" || dbColumn === "remittance_received") {
            record[dbColumn] = value.toLowerCase() === "true" || value === "1";
            return;
          }
          
          // Handle numeric fields
          if (dbColumn.includes("fee") || dbColumn.includes("amount") || dbColumn.includes("vat") || dbColumn.includes("rate") || dbColumn.includes("percent") || dbColumn === "capacity") {
            const num = parseFloat(value);
            if (!isNaN(num)) record[dbColumn] = num;
            return;
          }
          
          record[dbColumn] = value;
        });
        
        return record;
      }).filter(record => Object.keys(record).length > 0);

      if (recordsToInsert.length === 0) {
        toast.error("No valid records found in CSV");
        return;
      }

      // Insert in batches
      const batchSize = 100;
      let imported = 0;
      
      for (let i = 0; i < recordsToInsert.length; i += batchSize) {
        const batch = recordsToInsert.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from(selectedTable)
          .insert(batch);

        if (error) {
          console.error("Import error:", error);
          toast.error(`Error importing batch: ${error.message}`);
        } else {
          imported += batch.length;
        }
      }

      toast.success(`Successfully imported ${imported} records into ${tableConfig.label}`);
      setImportFile(null);
      setCsvHeaders([]);
      setCsvData([]);
      setFieldMapping({});
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(`Failed to import: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Management</h1>
        <p className="text-muted-foreground">Import and export data for all tables</p>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Tables to CSV
              </CardTitle>
              <CardDescription>
                Download data from your tables as CSV files. Perfect for backups and external analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                <div>
                  <h3 className="font-semibold">Export All Tables</h3>
                  <p className="text-sm text-muted-foreground">Download CSV files for all tables at once</p>
                </div>
                <Button onClick={handleExportAll} disabled={exporting}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TABLES.map((table) => (
                  <Card key={table.name} className="hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg">{table.label}</CardTitle>
                      <CardDescription className="text-xs">
                        {table.columns.length} columns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleExport(table)}
                        disabled={exporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data from CSV
              </CardTitle>
              <CardDescription>
                Upload CSV files to import data into your tables. The CSV must match the table structure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="table-select">Select Table</Label>
                <select
                  id="table-select"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value as TableName)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {TABLES.map((table) => (
                    <option key={table.name} value={table.name}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv-file">Upload CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                {importFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-warning/10 border border-warning/20 p-4">
                <h4 className="font-semibold text-sm mb-2">⚠️ Important Notes:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• The CSV must have a header row matching the table columns</li>
                  <li>• Existing records will not be updated (only new records are inserted)</li>
                  <li>• Make sure foreign key relationships are valid (e.g., client_id must exist)</li>
                  <li>• Calculated fields (VAT, profit %) will be computed automatically</li>
                  <li>• For large files, import may take several seconds</li>
                </ul>
              </div>

              <Button 
                onClick={handleStartImport} 
                disabled={!importFile || importing}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? "Importing..." : "Map Fields & Import"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expected CSV Format</CardTitle>
            </CardHeader>
            <CardContent>
              {TABLES.find(t => t.name === selectedTable) && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your CSV file should have these columns for <strong>{TABLES.find(t => t.name === selectedTable)?.label}</strong>:
                  </p>
                  <div className="p-3 bg-muted rounded-md font-mono text-xs overflow-x-auto">
                    {TABLES.find(t => t.name === selectedTable)?.columns.join(", ")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FieldMappingDialog
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        csvHeaders={csvHeaders}
        tableColumns={TABLES.find(t => t.name === selectedTable)?.columns || []}
        tableName={TABLES.find(t => t.name === selectedTable)?.label || ""}
        onConfirm={handleConfirmMapping}
      />
    </div>
  );
}
