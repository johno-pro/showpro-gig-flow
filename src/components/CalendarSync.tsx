import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CalendarSyncProps {
  bookingId: string;
  bookingData: any;
}

export function CalendarSync({ bookingId, bookingData }: CalendarSyncProps) {
  const [loading, setLoading] = useState(false);

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
      const { data, error } = await supabase.functions.invoke('google-sync', {
        body: { bookingId, action: 'export' }
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

  return (
    <div className="flex gap-2">
      <Button onClick={handleExportICal} variant="outline" disabled={loading} size="sm">
        <Download className="h-4 w-4 mr-1" />
        Export iCal
      </Button>
      <Button onClick={handleExportGoogle} variant="outline" disabled={loading} size="sm">
        <CalIcon className="h-4 w-4 mr-1" />
        Sync to Google
      </Button>
    </div>
  );
}
