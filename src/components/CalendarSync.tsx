import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalIcon, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CalendarSyncProps {
  bookingId: string;
  bookingData: any;
}

export function CalendarSync({ bookingId, bookingData }: CalendarSyncProps) {
  const [loading, setLoading] = useState(false);
  const [clashes, setClashes] = useState<any[]>([]);

  const handleExportICal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ical', {
        body: { bookingId }
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data.icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-${bookingId}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Calendar event exported!');
    } catch (error: any) {
      console.error('iCal export error:', error);
      toast.error('Failed to export calendar event');
    } finally {
      setLoading(false);
    }
  };

  const handleExportGoogle = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session ? `Bearer ${session.access_token}` : '';

      const { data, error } = await supabase.functions.invoke('google-sync', {
        body: { bookingId, action: 'export', authHeader }
      });

      if (error) throw error;

      if (data.authUrl) {
        // Open OAuth flow in new window
        window.open(data.authUrl, '_blank', 'width=600,height=600');
        toast.success('Please sign in to Google Calendar');
      } else {
        toast.success('Added to Google Calendar!');
      }
    } catch (error: any) {
      console.error('Google sync error:', error);
      toast.error('Failed to sync with Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCalendar = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session ? `Bearer ${session.access_token}` : '';

      const { data, error } = await supabase.functions.invoke('google-sync', {
        body: { bookingId, action: 'import', authHeader }
      });

      if (error) throw error;

      const foundClashes = data.clashes || [];
      setClashes(foundClashes);

      if (foundClashes.length > 0) {
        toast.warning(`${foundClashes.length} clash(es) found in your calendar!`, {
          description: 'Check the list below for details'
        });
      } else {
        toast.success('No clashes - booking time is clear!');
      }
    } catch (error: any) {
      console.error('Calendar import error:', error);
      toast.error(error.message || 'Failed to check calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button onClick={handleExportICal} variant="outline" disabled={loading} size="sm">
          <Download className="h-4 w-4 mr-1" />
          Export iCal
        </Button>
        <Button onClick={handleExportGoogle} variant="outline" disabled={loading} size="sm">
          <CalIcon className="h-4 w-4 mr-1" />
          Sync to Google
        </Button>
        <Button onClick={handleImportCalendar} variant="secondary" disabled={loading} size="sm">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Check Clashes
        </Button>
      </div>

      {clashes.length > 0 && (
        <div className="p-3 border border-warning/50 bg-warning/10 rounded-md space-y-2">
          <div className="font-medium text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            {clashes.length} Calendar Clash{clashes.length > 1 ? 'es' : ''} Found
          </div>
          <div className="space-y-1 text-xs">
            {clashes.map((clash: any, i: number) => (
              <div key={i} className="text-muted-foreground">
                • {clash.summary} ({new Date(clash.start.dateTime || clash.start.date).toLocaleString('en-GB')})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
