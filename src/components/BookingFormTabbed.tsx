import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { formatGBP } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarSync } from './CalendarSync';
import { CalendarConnectionStatus } from './CalendarConnectionStatus';
import { DateTimePicker } from '@/components/ui/date-time-picker';

const bookingSchema = z.object({
  artist_id: z.string().optional(),
  venue_id: z.string().optional(),
  client_id: z.string().min(1, "Client is required"),
  location_id: z.string().optional(),
  arrival_time: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  buy_rate: z.number().min(0).optional(),
  sell_rate: z.number().min(0).optional(),
  vat_rate_client: z.number().min(0).max(100).default(20),
  vat_rate_artist: z.number().min(0).max(100).default(20),
  notes: z.string().optional(),
  status: z.enum(['draft', 'enquiry', 'pencil', 'confirmed']).default('draft'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function BookingFormTabbed({ 
  defaultValues, 
  bookingId,
  onSuccess 
}: { 
  defaultValues?: Partial<BookingFormData>; 
  bookingId?: string;
  onSuccess?: () => void;
}) {
  const [venues, setVenues] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({ artist: 0, agency: 0, artistVat: 0, agencyVat: 0, artistTotal: 0, agencyTotal: 0 });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | undefined>(bookingId);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);

  // Update currentBookingId if bookingId prop changes
  useEffect(() => {
    if (bookingId && bookingId !== currentBookingId) {
      setCurrentBookingId(bookingId);
    }
  }, [bookingId]);

  const applyCommissionPreset = (commissionPercent: number) => {
    const sellRate = form.getValues('sell_rate') || 150;
    const buyRate = sellRate * (1 - commissionPercent / 100);
    form.setValue('buy_rate', Math.round(buyRate * 100) / 100);
  };

  // Helper to check if artist is a reindeer act
  const isReindeerAct = (artistId: string | undefined) => {
    if (!artistId) return false;
    const artist = artists.find(a => a.id === artistId);
    return artist?.name?.toLowerCase().includes('reindeer');
  };

  // Get default times based on artist type
  const getDefaultTimes = (artistId?: string) => {
    if (isReindeerAct(artistId)) {
      return { start: "12:00", end: "16:00", arrival: "11:00" };
    }
    return { start: "19:30", end: "23:30", arrival: "18:30" };
  };

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      arrival_time: "18:30",
      start_date: new Date(),
      end_date: new Date(),
      start_time: "19:30",
      end_time: "23:30",
      buy_rate: 127.50,
      sell_rate: 150,
      vat_rate_client: 20,
      vat_rate_artist: 20,
      status: 'draft',
      ...defaultValues,
    },
  });

  useEffect(() => {
    fetchDropdownData();
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchDropdownData = async () => {
    const [venuesRes, artistsRes, clientsRes] = await Promise.all([
      supabase.from('venues').select('id, name').order('name'),
      supabase.from('artists').select('id, name').order('name'),
      supabase.from('clients').select('id, name').order('name'),
    ]);
    
    setVenues(venuesRes.data || []);
    setArtists(artistsRes.data || []);
    setClients(clientsRes.data || []);
  };

  const fetchBooking = async () => {
    if (!bookingId) return;
    
    isLoadingRef.current = true;
    setLoadingBooking(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();
      
    if (data && !error) {
      // Ensure currentBookingId is set when editing
      setCurrentBookingId(bookingId);
      
      // Combine date and time into datetime objects
      const startDateTime = new Date(data.start_date || new Date());
      if (data.start_time) {
        const [hours, minutes] = data.start_time.split(':');
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
      }
      
      const endDateTime = new Date(data.finish_date || data.start_date || new Date());
      if (data.end_time) {
        const [hours, minutes] = data.end_time.split(':');
        endDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
      }
      
      form.reset({
        artist_id: data.artist_id || '',
        venue_id: data.venue_id || '',
        client_id: data.client_id,
        location_id: data.location_id || '',
        arrival_time: data.arrival_time || '18:00',
        start_date: startDateTime,
        end_date: endDateTime,
        start_time: data.start_time || '19:00',
        end_time: data.end_time || '23:30',
        buy_rate: data.buy_fee || 127.50,
        sell_rate: data.sell_fee || 150,
        vat_rate_client: data.vat_rate || 20,
        vat_rate_artist: data.vat_rate || 20,
        notes: data.notes || '',
        status: data.status as any || 'draft',
      });
      
      if (data.client_id) {
        fetchLocations(data.client_id);
      }
    }
    setLoadingBooking(false);
    // Delay clearing the loading ref to ensure form has fully settled
    setTimeout(() => {
      isLoadingRef.current = false;
    }, 100);
  };

  const fetchLocations = async (clientId: string) => {
    const { data } = await supabase
      .from('locations')
      .select('id, name')
      .eq('client_id', clientId)
      .order('name');
    setLocations(data || []);
  };

  // Calculate preview with VAT
  useEffect(() => {
    const subscription = form.watch((value) => {
      const { buy_rate = 0, sell_rate = 0, vat_rate_client = 20, vat_rate_artist = 20 } = value;
      const artistNet = buy_rate || 0;
      const agencyNet = (sell_rate || 0) - (buy_rate || 0);
      const artistVat = artistNet * ((vat_rate_artist as number) / 100);
      const agencyVat = (sell_rate || 0) * ((vat_rate_client as number) / 100);
      
      setPreview({ 
        artist: artistNet,
        agency: agencyNet,
        artistVat,
        agencyVat,
        artistTotal: artistNet + artistVat,
        agencyTotal: (sell_rate || 0) + agencyVat
      });
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Auto-save draft every 2 seconds (but not while loading booking data)
  useEffect(() => {
    const subscription = form.watch(() => {
      // Don't auto-save while loading existing booking data (use ref for synchronous check)
      if (isLoadingRef.current) return;
      
      const values = form.getValues();
      if (values.client_id || values.artist_id || values.notes) {
        // Clear existing timer
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        // Set new timer
        autoSaveTimerRef.current = setTimeout(() => handleSaveDraft(), 2000);
      }
    });
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      subscription.unsubscribe();
    };
  }, [currentBookingId]);

  const handleSaveDraft = async () => {
    const values = form.getValues();
    if (!values.client_id || saving) return;

    setSaving(true);
    const artistNet = values.buy_rate || 0;
    const clientNet = values.sell_rate || 0;
    
    const draftData: any = {
      artist_id: values.artist_id || null,
      venue_id: values.venue_id || null,
      client_id: values.client_id,
      location_id: values.location_id || null,
      arrival_time: values.arrival_time || null,
      start_date: values.start_date?.toISOString().split('T')[0],
      finish_date: values.end_date?.toISOString().split('T')[0],
      start_time: values.start_time || null,
      end_time: values.end_time || null,
      buy_fee: artistNet,
      sell_fee: clientNet,
      vat_rate: values.vat_rate_client || 20,
      vat_in: artistNet * ((values.vat_rate_artist || 20) / 100),
      vat_out: clientNet * ((values.vat_rate_client || 20) / 100),
      notes: values.notes || null,
      status: values.status === 'draft' ? 'enquiry' : values.status,
      booking_date: values.start_date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    };

    if (currentBookingId) {
      // Update existing booking
      const { error } = await supabase.from('bookings').update(draftData).eq('id', currentBookingId);
      if (!error) {
        setLastSaved(new Date());
      }
    } else {
      // Insert new booking and capture the ID
      const { data, error } = await supabase.from('bookings').insert(draftData).select('id').single();
      if (!error && data) {
        setCurrentBookingId(data.id);
        setLastSaved(new Date());
      }
    }
    setSaving(false);
  };

  const onSubmit = async (data: BookingFormData) => {
    setSaving(true);
    try {
      const artistNet = data.buy_rate || 0;
      const clientNet = data.sell_rate || 0;
      
      const bookingData = {
        artist_id: data.artist_id || null,
        venue_id: data.venue_id || null,
        client_id: data.client_id,
        location_id: data.location_id || null,
        arrival_time: data.arrival_time || null,
        start_date: data.start_date?.toISOString().split('T')[0],
        finish_date: data.end_date?.toISOString().split('T')[0],
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        buy_fee: artistNet,
        sell_fee: clientNet,
        vat_rate: data.vat_rate_client || 20,
        vat_in: artistNet * ((data.vat_rate_artist || 20) / 100),
        vat_out: clientNet * ((data.vat_rate_client || 20) / 100),
        notes: data.notes || null,
        status: data.status === 'draft' ? 'enquiry' : data.status,
        booking_date: data.start_date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      };

      const { data: insertedData, error } = currentBookingId
        ? await supabase.from('bookings').update(bookingData).eq('id', currentBookingId)
        : await supabase.from('bookings').insert(bookingData).select('id').single();

      if (error) throw error;
      
      // Set the ID if we just created a new booking
      if (!currentBookingId && insertedData) {
        setCurrentBookingId((insertedData as any).id);
      }
      
      toast.success(currentBookingId ? 'Booking updated!' : 'Booking created!');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {lastSaved && (
          <div className="text-xs text-muted-foreground">
            Draft saved at {lastSaved.toLocaleTimeString()}
          </div>
        )}
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="times">Times</TabsTrigger>
            <TabsTrigger value="money">Money</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      fetchLocations(value);
                      form.setValue('location_id', '');
                      form.setValue('venue_id', '');
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!form.watch('client_id')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="artist_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Apply default times based on artist type (only for new bookings)
                      if (!bookingId) {
                        const defaults = getDefaultTimes(value);
                        form.setValue('start_time', defaults.start);
                        form.setValue('end_time', defaults.end);
                        form.setValue('arrival_time', defaults.arrival);
                        // Update the date objects with new times
                        const startDate = form.getValues('start_date') || new Date();
                        const endDate = form.getValues('end_date') || new Date();
                        const [startH, startM] = defaults.start.split(':').map(Number);
                        const [endH, endM] = defaults.end.split(':').map(Number);
                        startDate.setHours(startH, startM, 0);
                        endDate.setHours(endH, endM, 0);
                        form.setValue('start_date', new Date(startDate));
                        form.setValue('end_date', new Date(endDate));
                      }
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select artist" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {artists.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venue_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {venues.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="times" className="space-y-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <DateTimePicker
                    label="Performance Start"
                    value={field.value || new Date()}
                    onChange={(date) => {
                      field.onChange(date);
                      // Also update start_time to match
                      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                      form.setValue('start_time', timeStr);
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <DateTimePicker
                    label="Performance End"
                    value={field.value || new Date()}
                    onChange={(date) => {
                      field.onChange(date);
                      // Also update end_time to match
                      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                      form.setValue('end_time', timeStr);
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="arrival_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arrival Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} placeholder="18:00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="money" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buy_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buy Rate (£) - Artist</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="127.50" 
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : parseFloat(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sell_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sell Rate (£) - Client</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="150.00" 
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : parseFloat(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <div className="text-sm font-medium text-muted-foreground mr-2 self-center">Quick Commission:</div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => applyCommissionPreset(15)}
                >
                  15% Commission
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => applyCommissionPreset(7.5)}
                >
                  7.5% Commission
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vat_rate_artist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist VAT Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="20.0"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 20)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vat_rate_client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client VAT Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="20.0"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 20)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Fee Summary (with VAT)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Buy Rate (Artist Net):</span>
                  <span>{formatGBP(preview.artist)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Artist VAT ({form.watch('vat_rate_artist')}%):</span>
                  <span>{formatGBP(preview.artistVat)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Artist Total (inc VAT):</span>
                  <span>{formatGBP(preview.artistTotal)}</span>
                </div>
                
                <div className="border-t pt-2 mt-2" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sell Rate (Client Net):</span>
                  <span>{formatGBP(form.watch('sell_rate') || 0)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Client VAT ({form.watch('vat_rate_client')}%):</span>
                  <span>{formatGBP(preview.agencyVat)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Client Total (inc VAT):</span>
                  <span>{formatGBP(preview.agencyTotal)}</span>
                </div>
                
                <div className="border-t pt-2 mt-2" />
                
                <div className="flex justify-between text-sm font-semibold text-primary">
                  <span>Agency Margin:</span>
                  <span>{formatGBP(preview.agency)}</span>
                </div>
                {(form.watch('sell_rate') || 0) > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Commission: {(((form.watch('sell_rate') || 0) - (form.watch('buy_rate') || 0)) / (form.watch('sell_rate') || 1) * 100).toFixed(1)}%
                  </div>
                )}
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="enquiry">Enquiry</SelectItem>
                      <SelectItem value="pencil">Pencil</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentBookingId && (
              <div className="pt-4 border-t space-y-4">
                <CalendarConnectionStatus />
                <div>
                  <div className="mb-2 text-sm font-medium">Calendar Export</div>
                  <CalendarSync bookingId={currentBookingId} bookingData={form.getValues()} />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional booking notes..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : bookingId ? 'Update Booking' : 'Create Booking'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={saving}
          >
            Save Draft
          </Button>
        </div>
      </form>
    </Form>
  );
}
