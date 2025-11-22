import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function CalendarConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_token, google_calendar_token_expiry')
        .eq('id', user.id)
        .single();

      if (profile?.google_calendar_token) {
        setIsConnected(true);
        if (profile.google_calendar_token_expiry) {
          setExpiryDate(new Date(profile.google_calendar_token_expiry));
        }
      }
    } catch (error) {
      console.error('Error loading connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = expiryDate && expiryDate < new Date();
  const isExpiringSoon = expiryDate && expiryDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Google Calendar Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="bg-muted">
                Not Connected
              </Badge>
            </>
          )}
        </div>

        {isConnected && expiryDate && (
          <div className="flex items-start gap-2 text-sm">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              {isExpired ? (
                <p className="text-destructive">
                  Token expired {formatDistanceToNow(expiryDate, { addSuffix: true })}
                </p>
              ) : isExpiringSoon ? (
                <p className="text-warning">
                  Expires {formatDistanceToNow(expiryDate, { addSuffix: true })}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Valid until {expiryDate.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {!isConnected && (
          <p className="text-xs text-muted-foreground">
            Connect your Google Calendar to sync bookings and check for clashes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
