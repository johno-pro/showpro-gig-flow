import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function DataImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    clients: number;
    venues: number;
    artists: number;
    errors: string[];
  } | null>(null);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const importClients = async (csvData: string[][]): Promise<Map<string, string>> => {
    const clientMap = new Map<string, string>();
    let imported = 0;

    // Skip header rows and empty rows
    const dataRows = csvData.filter((row, idx) => idx > 0 && row[1]?.trim());

    for (const row of dataRows) {
      const companyName = row[1]?.trim();
      const address = row[4]?.trim();
      
      if (!companyName || companyName === 'VENUE is CLIENT') continue;

      try {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            name: companyName,
            address: address || null,
          })
          .select('id, name')
          .single();

        if (error) throw error;
        if (data) {
          clientMap.set(companyName, data.id);
          imported++;
        }
      } catch (error: any) {
        console.error(`Error importing client ${companyName}:`, error.message);
      }
    }

    return clientMap;
  };

  const importVenues = async (csvData: string[][], clientMap: Map<string, string>): Promise<number> => {
    let imported = 0;

    // Skip header and filter valid rows
    const dataRows = csvData.filter((row, idx) => idx > 0 && row[2]?.trim());

    for (const row of dataRows) {
      const companyName = row[1]?.trim();
      const venueName = row[2]?.trim();
      const town = row[3]?.trim();
      const address = row[5]?.trim();

      if (!venueName) continue;

      const clientId = clientMap.get(companyName);

      try {
        const { error } = await supabase
          .from('venues')
          .insert({
            name: venueName,
            park_id: clientId || null,
            notes: [town, address].filter(Boolean).join(', ') || null,
          });

        if (error) throw error;
        imported++;
      } catch (error: any) {
        console.error(`Error importing venue ${venueName}:`, error.message);
      }
    }

    return imported;
  };

  const importArtists = async (csvData: string[][]): Promise<number> => {
    let imported = 0;

    // Skip header rows (first 7 rows) and filter valid artist rows
    const dataRows = csvData.filter((row, idx) => idx >= 8 && row[1]?.trim());

    for (const row of dataRows) {
      const fullName = row[1]?.trim();
      const org = row[2]?.trim();
      const contactType = row[3]?.trim();
      const phone = row[6]?.trim();
      const email = row[7]?.trim();

      if (!fullName) continue;

      try {
        const { error } = await supabase
          .from('artists')
          .insert({
            name: fullName,
            act_type: contactType || null,
            phone: phone || null,
            email: email || null,
            notes: org ? `Organization: ${org}` : null,
          });

        if (error) throw error;
        imported++;
      } catch (error: any) {
        console.error(`Error importing artist ${fullName}:`, error.message);
      }
    }

    return imported;
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    const errors: string[] = [];
    
    try {
      toast.info("Starting data import...");

      // Import Clients
      setProgress(10);
      const clientsCSV = await fetch('/CLIENTS.csv').then(r => r.text());
      const clientsData = parseCSV(clientsCSV);
      const clientMap = await importClients(clientsData);
      const clientsCount = clientMap.size;
      
      setProgress(40);
      toast.success(`Imported ${clientsCount} clients`);

      // Import Venues
      const venuesCSV = await fetch('/VENUES.csv').then(r => r.text());
      const venuesData = parseCSV(venuesCSV);
      const venuesCount = await importVenues(venuesData, clientMap);
      
      setProgress(70);
      toast.success(`Imported ${venuesCount} venues`);

      // Import Artists
      const artistsCSV = await fetch('/ARTISTS_AS_OF_16-10-25.csv').then(r => r.text());
      const artistsData = parseCSV(artistsCSV);
      const artistsCount = await importArtists(artistsData);
      
      setProgress(100);
      toast.success(`Imported ${artistsCount} artists`);

      setResults({
        clients: clientsCount,
        venues: venuesCount,
        artists: artistsCount,
        errors,
      });
    } catch (error: any) {
      toast.error("Import failed: " + error.message);
      errors.push(error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Data Import
          </CardTitle>
          <CardDescription>
            Import artists, venues, and clients from CSV files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will import data from the uploaded CSV files:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>CLIENTS.csv → clients table</li>
              <li>VENUES.csv → venues table (linked to clients)</li>
              <li>ARTISTS_AS_OF_16-10-25.csv → artists table</li>
            </ul>
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">Importing... {progress}%</p>
            </div>
          )}

          {results && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Import Complete</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>✓ {results.clients} clients imported</p>
                <p>✓ {results.venues} venues imported</p>
                <p>✓ {results.artists} artists imported</p>
              </div>
              {results.errors.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Errors:</span>
                  </div>
                  <ul className="text-xs space-y-1">
                    {results.errors.map((error, idx) => (
                      <li key={idx} className="text-destructive">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={importing || !!results}
            size="lg"
            className="w-full"
          >
            {importing ? "Importing..." : results ? "Import Complete" : "Start Import"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
