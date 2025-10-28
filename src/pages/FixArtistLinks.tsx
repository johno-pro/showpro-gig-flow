import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FixArtistLinks() {
  const navigate = useNavigate();
  const [isFixing, setIsFixing] = useState(false);
  const [progress, setProgress] = useState("");

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    return lines.map(line => {
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      return values;
    });
  };

  const fixArtistLinks = async () => {
    setIsFixing(true);
    setProgress("Loading booking data from CSV...");

    try {
      const response = await fetch('/BOOKINGS.csv');
      const csvText = await response.text();
      const csvData = parseCSV(csvText);

      setProgress("Processing bookings...");
      let updated = 0;
      let notFound = 0;

      // Skip header row
      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        if (row.length < 5 || !row[0]) continue;

        const jobCode = row[0].trim();
        const artistName = row[4].trim();

        if (!artistName || artistName === '?' || artistName === '') {
          continue;
        }

        // Find the artist by name
        const { data: artist } = await supabase
          .from("artists")
          .select("id")
          .ilike("name", artistName)
          .maybeSingle();

        if (artist) {
          // Update the booking with this job code
          const { error } = await supabase
            .from("bookings")
            .update({ artist_id: artist.id })
            .eq("job_code", jobCode);

          if (!error) {
            updated++;
            setProgress(`Updated ${updated} bookings...`);
          }
        } else {
          notFound++;
        }
      }

      setProgress("Complete!");
      toast.success(`Successfully restored ${updated} artist links!`);
      if (notFound > 0) {
        toast.info(`${notFound} artists not found in database`);
      }
    } catch (error: any) {
      toast.error("Failed to fix artist links");
      console.error("Error:", error);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/bookings")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Fix Artist Links</h1>
          <p className="text-muted-foreground">Restore artist assignments to bookings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restore Artist Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will restore the artist assignments to all bookings by matching them with the original CSV data.
          </p>
          
          {progress && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">{progress}</p>
            </div>
          )}

          <Button onClick={fixArtistLinks} disabled={isFixing}>
            {isFixing ? "Fixing..." : "Fix Artist Links"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
