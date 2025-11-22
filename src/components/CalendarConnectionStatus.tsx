import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle2, XCircle, Unplug } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function CalendarConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    loadConnectionStatus();
    checkForOAuthResult();
  }, []);

  const checkForOAuthResult = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const calendarConnected = urlParams.get('calendar_connected');
    const error = urlParams.get('error');

    if (calendarConnected === 'true') {
      toast.success('Google Calendar connected successfully!', {
        description: 'You can now sync bookings and check for clashes'
      });
      // Reload connection status to show updated info
      setTimeout(() => loadConnectionStatus(), 500);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'access_denied': 'You denied access to Google Calendar. Please try again if you want to connect.',
        'Missing authorization code or state': 'Authorization failed. Please try connecting again.',
        'Failed to exchange authorization code': 'Could not complete authorization. Please check your internet connection and try again.',
        'Failed to store calendar tokens': 'Could not save your calendar connection. Please try again or contact support.',
      };

      const friendlyMessage = errorMessages[error] || `Connection failed: ${error}`;
      
      toast.error('Failed to connect Google Calendar', {
        description: friendlyMessage
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

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

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get current token to revoke
      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_token')
        .eq('id', user.id)
        .single();

      // Revoke token with Google
      if (profile?.google_calendar_token) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${profile.google_calendar_token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
        } catch (error) {
          console.warn('Failed to revoke token with Google:', error);
          // Continue anyway to clear local tokens
        }
      }

      // Clear tokens from database
      const { error } = await supabase
        .from('profiles')
        .update({
          google_calendar_token: null,
          google_calendar_refresh_token: null,
          google_calendar_token_expiry: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsConnected(false);
      setExpiryDate(null);
      toast.success('Google Calendar disconnected');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect calendar');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session ? `Bearer ${session.access_token}` : '';

      const { data, error } = await supabase.functions.invoke('google-sync', {
        body: { bookingId: 'reconnect', action: 'export', authHeader }
      });

      if (error) throw error;

      if (data.authUrl) {
        // Redirect to OAuth flow (will return to this page with status params)
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      console.error('Reconnect error:', error);
      toast.error('Failed to start connection', {
        description: 'Please try again or contact support if the issue persists'
      });
    } finally {
      setReconnecting(false);
    }
  };

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
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Connect your Google Calendar to sync bookings and check for clashes
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              disabled={reconnecting}
              className="w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {reconnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
          </>
        )}

        {isConnected && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Unplug className="h-4 w-4 mr-2" />
            {disconnecting ? 'Disconnecting...' : 'Disconnect Calendar'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
