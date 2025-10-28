import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DataImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bookingFile, setBookingFile] = useState<File | null>(null);
  const [results, setResults] = useState<{
    clients: number;
    venues: number;
    artists: number;
    bookings: number;
    bookingsSkipped: number;
    bookingsUpdated: number;
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

    // Fetch existing clients
    const { data: existingClients } = await supabase.from('clients').select('id, name');
    const existingMap = new Map(existingClients?.map(c => [c.name.toLowerCase().trim(), c.id]) || []);

    for (const row of dataRows) {
      const companyName = row[1]?.trim();
      const address = row[4]?.trim();
      
      if (!companyName || companyName === 'VENUE is CLIENT') continue;

      // Check if client already exists
      const existingId = existingMap.get(companyName.toLowerCase().trim());
      if (existingId) {
        clientMap.set(companyName, existingId);
        continue;
      }

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
          existingMap.set(companyName.toLowerCase().trim(), data.id);
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

    // Fetch existing venues
    const { data: existingVenues } = await supabase.from('venues').select('name');
    const existingNames = new Set(existingVenues?.map(v => v.name.toLowerCase().trim()) || []);

    for (const row of dataRows) {
      const companyName = row[1]?.trim();
      const venueName = row[2]?.trim();
      const town = row[3]?.trim();
      const address = row[5]?.trim();

      if (!venueName) continue;

      // Skip if venue already exists
      if (existingNames.has(venueName.toLowerCase().trim())) {
        continue;
      }

      const clientId = clientMap.get(companyName);

      try {
        const { error } = await supabase
          .from('venues')
          .insert({
            name: venueName,
            location_id: clientId || null,
            notes: [town, address].filter(Boolean).join(', ') || null,
          });

        if (error) throw error;
        existingNames.add(venueName.toLowerCase().trim());
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

    // Fetch existing artists
    const { data: existingArtists } = await supabase.from('artists').select('name');
    const existingNames = new Set(existingArtists?.map(a => a.name.toLowerCase().trim()) || []);

    for (const row of dataRows) {
      const fullName = row[1]?.trim();
      const org = row[2]?.trim();
      const contactType = row[3]?.trim();
      const phone = row[6]?.trim();
      const email = row[7]?.trim();

      if (!fullName) continue;

      // Skip if artist already exists
      if (existingNames.has(fullName.toLowerCase().trim())) {
        continue;
      }

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
        existingNames.add(fullName.toLowerCase().trim());
        imported++;
      } catch (error: any) {
        console.error(`Error importing artist ${fullName}:`, error.message);
      }
    }

    return imported;
  };

  const importBookings = async (csvData: string[][]): Promise<{ imported: number; skipped: number; updated: number }> => {
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    const missingClients = new Set<string>();
    
    // Skip header row and filter valid rows (exclude totals and empty rows)
    const dataRows = csvData.filter((row, idx) => 
      idx > 0 && 
      row.length > 0 && 
      row[0]?.trim() !== 'TOTAL' &&
      row[0]?.trim() !== ''
    );

    // First, fetch all clients, locations, and artists to create lookup maps
    const { data: clients } = await supabase.from('clients').select('id, name');
    const { data: locations } = await supabase.from('locations').select('id, name');
    const { data: artists } = await supabase.from('artists').select('id, name');

    const clientMap = new Map(clients?.map(c => [c.name.toLowerCase().trim(), c.id]) || []);
    const locationMap = new Map(locations?.map(l => [l.name.toLowerCase().trim(), l.id]) || []);
    const artistMap = new Map(artists?.map(a => [a.name.toLowerCase().trim(), a.id]) || []);

    // Fetch existing booking job codes to avoid duplicates
    const { data: existingBookings } = await supabase.from('bookings').select('job_code');
    const existingJobCodes = new Set(existingBookings?.map(b => b.job_code).filter(Boolean) || []);

    console.log(`Found ${clientMap.size} clients, ${locationMap.size} locations, ${artistMap.size} artists`);

    for (const row of dataRows) {
      try {
        // Parse date from DD/MMM/YYYY to YYYY-MM-DD
        const dateStr = row[1]?.trim();
        let bookingDate = null;
        if (dateStr) {
          const [day, monthStr, year] = dateStr.split('/');
          const monthMap: { [key: string]: string } = {
            Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
            Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
          };
          const month = monthMap[monthStr];
          bookingDate = `${year}-${month}-${day.padStart(2, '0')}`;
        }

        // Look up IDs by name
        const clientName = row[2]?.trim();
        const locationName = row[3]?.trim();
        const artistName = row[4]?.trim();
        
        // Find client ID - create if doesn't exist
        let clientId = clientName ? clientMap.get(clientName.toLowerCase().trim()) : null;
        
        // If client not found, try to create it
        if (!clientId && clientName) {
          try {
            const { data: newClient, error: clientError } = await supabase
              .from('clients')
              .insert({ name: clientName })
              .select('id')
              .single();
            
            if (!clientError && newClient) {
              clientId = newClient.id;
              clientMap.set(clientName.toLowerCase().trim(), newClient.id);
              console.log(`Created new client: ${clientName}`);
            }
          } catch (e) {
            console.log(`Could not create client: ${clientName}`);
          }
        }
        
        // Skip if still no client (client_id is required)
        if (!clientId) {
          missingClients.add(clientName || 'Unknown');
          skipped++;
          console.warn(`Skipping booking - missing client: ${clientName}`);
          continue;
        }
        
        // Find or create location
        let locationId = locationName ? locationMap.get(locationName.toLowerCase().trim()) || null : null;
        
        // If location not found, try to create it
        if (!locationId && locationName && clientId) {
          try {
            const { data: newLocation, error: locationError } = await supabase
              .from('locations')
              .insert({ 
                name: locationName,
                client_id: clientId 
              })
              .select('id')
              .single();
            
            if (!locationError && newLocation) {
              locationId = newLocation.id;
              locationMap.set(locationName.toLowerCase().trim(), newLocation.id);
              console.log(`Created new location: ${locationName}`);
            }
          } catch (e) {
            console.log(`Could not create location: ${locationName}`);
          }
        }
        
        const artistId = artistName && artistName !== '?' ? artistMap.get(artistName.toLowerCase().trim()) || null : null;

        // Parse fee amount (remove commas)
        const feeStr = row[6]?.trim()?.replace(/,/g, '');
        const artistFee = feeStr ? parseFloat(feeStr) : null;

        // Handle duplicate job codes by updating location
        let jobCode = row[0]?.trim() || null;
        if (jobCode && existingJobCodes.has(jobCode)) {
          // Update existing booking with location if we have one
          if (locationId) {
            const { error: updateError } = await supabase
              .from('bookings')
              .update({ location_id: locationId })
              .eq('job_code', jobCode);
            
            if (!updateError) {
              updated++;
              console.log(`Updated booking ${jobCode} with location: ${locationName}`);
            } else {
              console.error(`Error updating booking ${jobCode}:`, updateError.message);
              skipped++;
            }
          } else {
            skipped++;
          }
          continue;
        }

        const bookingData: any = {
          job_code: jobCode,
          booking_date: bookingDate,
          status: 'confirmed',
          client_id: clientId,
          location_id: locationId,
          artist_id: artistId,
          fee_model: 'commission',
          artist_fee: artistFee,
          client_fee: 0,
          notes: row[5]?.trim() || null,
        };

        const { error } = await supabase
          .from('bookings')
          .insert(bookingData);

        if (error) throw error;
        if (jobCode) existingJobCodes.add(jobCode);
        imported++;
      } catch (error: any) {
        skipped++;
        console.error(`Error importing booking:`, error.message);
      }
    }

    if (skipped > 0) {
      console.warn(`Skipped ${skipped} bookings. Missing clients: ${Array.from(missingClients).join(', ')}`);
    }

    return { imported, skipped, updated };
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    setResults(null); // Reset results on new import
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
      
      setProgress(85);
      toast.success(`Imported ${artistsCount} artists`);

      // Import Bookings (if file provided)
      let bookingsCount = 0;
      let bookingsSkipped = 0;
      let bookingsUpdated = 0;
      if (bookingFile) {
        const bookingText = await bookingFile.text();
        const bookingsData = parseCSV(bookingText);
        const result = await importBookings(bookingsData);
        bookingsCount = result.imported;
        bookingsSkipped = result.skipped;
        bookingsUpdated = result.updated;
        
        const messages = [];
        if (bookingsCount > 0) messages.push(`${bookingsCount} new`);
        if (bookingsUpdated > 0) messages.push(`${bookingsUpdated} updated`);
        if (bookingsSkipped > 0) messages.push(`${bookingsSkipped} skipped`);
        
        if (messages.length > 0) {
          toast.success(`Bookings: ${messages.join(', ')}`);
        }
      } else {
        // Try to fetch from public folder
        try {
          const bookingsCSV = await fetch('/BOOKINGS.csv').then(r => r.text());
          const bookingsData = parseCSV(bookingsCSV);
          const result = await importBookings(bookingsData);
          bookingsCount = result.imported;
          bookingsSkipped = result.skipped;
          bookingsUpdated = result.updated;
          
          const messages = [];
          if (bookingsCount > 0) messages.push(`${bookingsCount} new`);
          if (bookingsUpdated > 0) messages.push(`${bookingsUpdated} updated`);
          if (bookingsSkipped > 0) messages.push(`${bookingsSkipped} skipped`);
          
          if (messages.length > 0) {
            toast.success(`Bookings: ${messages.join(', ')}`);
          }
        } catch (e) {
          console.log('No bookings CSV file found in public folder');
        }
      }

      setProgress(100);

      setResults({
        clients: clientsCount,
        venues: venuesCount,
        artists: artistsCount,
        bookings: bookingsCount,
        bookingsSkipped: bookingsSkipped,
        bookingsUpdated: bookingsUpdated,
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
            Import artists, venues, clients, and bookings from CSV files
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
              <li>BOOKINGS.csv → bookings table (if available)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-csv">Upload Bookings CSV</Label>
            <Input
              id="booking-csv"
              type="file"
              accept=".csv"
              onChange={(e) => setBookingFile(e.target.files?.[0] || null)}
              disabled={importing}
            />
            <p className="text-xs text-muted-foreground">
              Expected columns: Code, Date (DD/MMM/YYYY), Client, Location, Artist, Job, Fees (buy fee)
            </p>
            <p className="text-xs text-muted-foreground">
              Note: Client, Location, and Artist names must match existing records. Sell fees will be set to 0.
            </p>
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
                <p>
                  ✓ {results.bookings} bookings imported
                  {results.bookingsUpdated > 0 && (
                    <span className="text-blue-600"> ({results.bookingsUpdated} updated)</span>
                  )}
                  {results.bookingsSkipped > 0 && (
                    <span className="text-amber-600"> ({results.bookingsSkipped} skipped)</span>
                  )}
                </p>
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
            disabled={importing}
            size="lg"
            className="w-full"
          >
            {importing ? "Importing..." : results ? "Import Again" : "Start Import"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
