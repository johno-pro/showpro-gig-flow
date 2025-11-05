import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, CheckCircle, AlertCircle, ShieldAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";

// File size limit: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// CSV row limit for security
const MAX_CSV_ROWS = 1000;

// Validation schemas
const clientSchema = z.object({
  name: z.string().trim().min(1).max(255),
  address: z.string().max(1000).optional().nullable(),
});

const venueSchema = z.object({
  name: z.string().trim().min(1).max(255),
  notes: z.string().max(2000).optional().nullable(),
  location_id: z.string().uuid().optional().nullable(),
});

const artistSchema = z.object({
  name: z.string().trim().min(1).max(255),
  act_type: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().max(255).optional().or(z.literal('')).nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const locationSchema = z.object({
  name: z.string().trim().min(1).max(255),
  address: z.string().max(1000).optional().nullable(),
  map_link_url: z.string().url().max(500).optional().or(z.literal('')).nullable(),
});

const contactSchema = z.object({
  name: z.string().trim().min(1).max(255),
  title: z.string().max(100).optional().nullable(),
  email: z.string().email().max(255).optional().or(z.literal('')).nullable(),
  phone: z.string().max(50).optional().nullable(),
  client_id: z.string().uuid(),
});

export default function DataImport() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bookingFile, setBookingFile] = useState<File | null>(null);
  const [locationFile, setLocationFile] = useState<File | null>(null);
  const [results, setResults] = useState<{
    clients: number;
    venues: number;
    artists: number;
    locations: number;
    contacts: number;
    bookings: number;
    bookingsSkipped: number;
    bookingsUpdated: number;
    errors: string[];
  } | null>(null);

  // Check if user has admin or manager role
  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setHasPermission(false);
        return;
      }

      try {
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;

        const hasAccess = roles?.some(r => r.role === 'admin' || r.role === 'manager');
        setHasPermission(hasAccess || false);
      } catch (error) {
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [user]);

  // Validate file size
  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" exceeds maximum size of 5MB`);
      return false;
    }
    return true;
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    
    // Security: Limit number of rows to prevent DoS
    if (lines.length > MAX_CSV_ROWS) {
      throw new Error(`CSV file exceeds maximum allowed rows (${MAX_CSV_ROWS}). File has ${lines.length} rows.`);
    }
    
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

  const importLocations = async (csvData: string[][]): Promise<number> => {
    let imported = 0;

    // Skip header row and filter valid rows
    const dataRows = csvData.filter((row, idx) => idx > 0 && row[0]?.trim());

    for (const row of dataRows) {
      const locationName = row[0]?.trim();
      const venueName = row[1]?.trim();
      const address = row[2]?.trim();
      const mapLinkUrl = row[3]?.trim();

      if (!locationName) continue;

      try {
        // Validate location data
        const validatedLocation = locationSchema.parse({
          name: locationName,
          address: address || null,
          map_link_url: mapLinkUrl || null,
        });

        // Check if location exists
        const { data: existingLocation } = await supabase
          .from("locations")
          .select("id")
          .eq("name", validatedLocation.name)
          .maybeSingle();

        let locationId = existingLocation?.id;

        if (!existingLocation) {
          // Create new location
          const { data: newLocation, error: locationError } = await supabase
            .from("locations")
            .insert({
              name: validatedLocation.name,
              address: validatedLocation.address,
              map_link_url: validatedLocation.map_link_url,
            })
            .select("id")
            .single();

          if (locationError) throw locationError;
          locationId = newLocation.id;
          imported++;
        } else {
          // Update existing location with new data if provided
          const { error: updateError } = await supabase
            .from("locations")
            .update({
              address: validatedLocation.address,
              map_link_url: validatedLocation.map_link_url,
            })
            .eq("id", existingLocation.id);

          if (updateError) throw updateError;
        }

        // Create or link venue if venue name provided
        if (venueName && locationId) {
          const validatedVenue = venueSchema.parse({
            name: venueName,
            location_id: locationId,
            notes: null,
          });

          const { data: existingVenue } = await supabase
            .from("venues")
            .select("id")
            .eq("name", validatedVenue.name)
            .maybeSingle();

          if (!existingVenue) {
            await supabase.from("venues").insert({
              name: validatedVenue.name,
              location_id: validatedVenue.location_id,
              notes: validatedVenue.notes,
            });
          } else {
            // Update venue's location if it exists
            await supabase
              .from("venues")
              .update({ location_id: validatedVenue.location_id })
              .eq("id", existingVenue.id);
          }
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          toast.error(`Invalid location data format`);
        }
      }
    }

    return imported;
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
        // Validate client data
        const validatedClient = clientSchema.parse({
          name: companyName,
          address: address || null,
        });

        const { data, error } = await supabase
          .from('clients')
          .insert({
            name: validatedClient.name,
            address: validatedClient.address,
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
        if (error instanceof z.ZodError) {
          toast.error("Invalid client data format");
        }
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
        // Validate venue data
        const validatedVenue = venueSchema.parse({
          name: venueName,
          location_id: clientId || null,
          notes: [town, address].filter(Boolean).join(', ') || null,
        });

        const { error } = await supabase
          .from('venues')
          .insert({
            name: validatedVenue.name,
            location_id: validatedVenue.location_id,
            notes: validatedVenue.notes,
          });

        if (error) throw error;
        existingNames.add(venueName.toLowerCase().trim());
        imported++;
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          toast.error("Invalid venue data format");
        }
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
        // Validate artist data
        const validatedArtist = artistSchema.parse({
          name: fullName,
          act_type: contactType || null,
          phone: phone || null,
          email: email || null,
          notes: org ? `Organization: ${org}` : null,
        });

        const { error } = await supabase
          .from('artists')
          .insert({
            name: validatedArtist.name,
            act_type: validatedArtist.act_type,
            phone: validatedArtist.phone,
            email: validatedArtist.email,
            notes: validatedArtist.notes,
          });

        if (error) throw error;
        existingNames.add(fullName.toLowerCase().trim());
        imported++;
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          toast.error("Invalid artist data format");
        }
      }
    }

    return imported;
  };

  const importContacts = async (csvData: string[][], clientMap: Map<string, string>): Promise<number> => {
    let imported = 0;

    // Skip header rows and empty rows
    const dataRows = csvData.filter((row, idx) => idx > 0 && row[1]?.trim());

    for (const row of dataRows) {
      const companyName = row[1]?.trim();
      
      if (!companyName || companyName === 'VENUE is CLIENT') continue;

      const clientId = clientMap.get(companyName);
      if (!clientId) continue;

      // Extract contact information from columns:
      // [5] Contact - Accounts
      // [6] Contact - Entertainments 1  
      // [7] Contact - Entertainments 2
      // [8] Contact - Emergency Number
      
      const contactFields = [
        { raw: row[5]?.trim(), title: 'Accounts Contact' },
        { raw: row[6]?.trim(), title: 'Entertainment Contact 1' },
        { raw: row[7]?.trim(), title: 'Entertainment Contact 2' },
        { raw: row[8]?.trim(), title: 'Emergency Contact' }
      ];

      for (const field of contactFields) {
        if (!field.raw || field.raw === 'Tel - Email') continue;

        // Parse contact info - format might be "Name - Email - Phone" or variations
        const parts = field.raw.split('-').map(p => p.trim());
        
        let name = parts[0] || field.title;
        let email = null;
        let phone = null;

        // Try to identify email and phone from parts
        for (const part of parts) {
          if (part.includes('@')) {
            email = part;
          } else if (/^[\d\s\(\)\+\-]+$/.test(part) && part.length > 5) {
            phone = part;
          }
        }

        // Skip if no meaningful data
        if (!name || name === 'Tel' || name === 'Email') continue;

        try {
          // Check if similar contact already exists for this client
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('client_id', clientId)
            .eq('title', field.title)
            .maybeSingle();

          if (existingContact) continue;

          // Validate contact data
          const validatedContact = contactSchema.parse({
            name: name,
            title: field.title,
            email: email,
            phone: phone,
            client_id: clientId,
          });

          const { error } = await supabase
            .from('contacts')
            .insert({
              name: validatedContact.name,
              title: validatedContact.title,
              email: validatedContact.email,
              phone: validatedContact.phone,
              client_id: validatedContact.client_id,
            });

          if (error) throw error;
          imported++;
        } catch (error: any) {
          if (error instanceof z.ZodError) {
            // Skip invalid contacts silently
          }
        }
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
            }
          } catch (e) {
            // Client creation failed - will skip booking
          }
        }
        
        // Skip if still no client (client_id is required)
        if (!clientId) {
          missingClients.add(clientName || 'Unknown');
          skipped++;
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
            }
          } catch (e) {
            // Location creation failed
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
            } else {
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
        // Silently skip invalid bookings
      }
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
      
      setProgress(30);
      toast.success(`Imported ${clientsCount} clients`);

      // Import Locations (if file provided)
      let locationsCount = 0;
      if (locationFile) {
        const locationText = await locationFile.text();
        const locationsData = parseCSV(locationText);
        locationsCount = await importLocations(locationsData);
        toast.success(`Imported ${locationsCount} locations`);
      }
      
      setProgress(50);

      // Import Venues
      const venuesCSV = await fetch('/VENUES.csv').then(r => r.text());
      const venuesData = parseCSV(venuesCSV);
      const venuesCount = await importVenues(venuesData, clientMap);
      
      setProgress(60);
      toast.success(`Imported ${venuesCount} venues`);

      // Import Contacts from CLIENTS.csv
      const contactsCount = await importContacts(clientsData, clientMap);
      
      setProgress(70);
      toast.success(`Imported ${contactsCount} contacts`);

      // Import Artists
      const artistsCSV = await fetch('/ARTISTS_AS_OF_16-10-25.csv').then(r => r.text());
      const artistsData = parseCSV(artistsCSV);
      const artistsCount = await importArtists(artistsData);
      
      setProgress(80);
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
          // No bookings CSV file in public folder
        }
      }

      setProgress(100);

      setResults({
        clients: clientsCount,
        venues: venuesCount,
        artists: artistsCount,
        locations: locationsCount,
        contacts: contactsCount,
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
      {hasPermission === null ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p>Checking permissions...</p>
          </CardContent>
        </Card>
      ) : hasPermission === false ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <ShieldAlert className="w-12 h-12 text-destructive" />
              <div>
                <h3 className="font-semibold text-lg">Access Restricted</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Only administrators and managers can access the data import feature.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please contact your system administrator if you need access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
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
              <li>CLIENTS.csv → clients table + contacts</li>
              <li>VENUES.csv → venues table (linked to clients)</li>
              <li>ARTISTS_AS_OF_16-10-25.csv → artists table</li>
              <li>BOOKINGS.csv → bookings table (if available)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-csv">Upload Locations CSV (Optional)</Label>
            <Input
              id="location-csv"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && validateFileSize(file)) {
                  setLocationFile(file);
                } else {
                  setLocationFile(null);
                  e.target.value = '';
                }
              }}
              disabled={importing}
            />
            <p className="text-xs text-muted-foreground">
              Expected columns: Location, Venue, Address, Map Link URL, Contact Name & Number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-csv">Upload Bookings CSV (Optional)</Label>
            <Input
              id="booking-csv"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && validateFileSize(file)) {
                  setBookingFile(file);
                } else {
                  setBookingFile(null);
                  e.target.value = '';
                }
              }}
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
                <p>✓ {results.locations} locations imported</p>
                <p>✓ {results.contacts} contacts imported</p>
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
      )}
    </div>
  );
}
