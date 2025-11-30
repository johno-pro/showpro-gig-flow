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
  total_rate: z.number().min(0).optional(),
  split_ratio: z.number().min(0.5).max(0.95).default(0.85),
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
  const [preview, setPreview] = useState({ artist: 0, agency: 0 });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | undefined>(bookingId);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);
  const [calculationMode, setCalculationMode] = useState<'split' | 'commission'>('split');
  const [defaultSplit, setDefaultSplit] = useState<number>(0.85);

  // Load default split from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('default_split_ratio');
    if (saved) {
      setDefaultSplit(parseFloat(saved));
    }
  }, []);

  // Update currentBookingId if bookingId prop changes
  useEffect(() => {
    if (bookingId && bookingId !== currentBookingId) {
      setCurrentBookingId(bookingId);
    }
  }, [bookingId]);

  const saveDefaultSplit = () => {
    const currentSplit = form.getValues('split_ratio') || 0.85;
    localStorage.setItem('default_split_ratio', currentSplit.toString());
    setDefaultSplit(currentSplit);
    toast.success(`Default split saved: ${Math.round(currentSplit * 100)}%`);
  };

  const applyPreset = (ratio: number) => {
    form.setValue('split_ratio', ratio);
  };

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      arrival_time: "18:00",
      start_date: new Date(),
      end_date: new Date(),
      start_time: "19:00",
      end_time: "23:30",
      total_rate: 150,
      split_ratio: 0.85,
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
        total_rate: data.sell_fee || 150,
        split_ratio: data.buy_fee && data.sell_fee ? data.buy_fee / data.sell_fee : 0.85,
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

  // Calculate split preview with VAT
  useEffect(() => {
    const subscription = form.watch((value) => {
      const { split_ratio = 0.85, total_rate = 0, vat_rate_client = 20, vat_rate_artist = 20 } = value;
      const artistNet = total_rate * split_ratio;
      const agencyNet = total_rate * (1 - split_ratio);
      const artistVat = artistNet * (vat_rate_artist / 100);
      const agencyVat = agencyNet * (vat_rate_client / 100);
      
      setPreview({ 
        artist: artistNet,
        agency: agencyNet,
        artistVat,
        agencyVat,
        artistTotal: artistNet + artistVat,
        agencyTotal: agencyNet + agencyVat
      } as any);
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
    const artistNet = values.total_rate ? values.total_rate * (values.split_ratio || 0.85) : 0;
    const clientNet = values.total_rate || 0;
    
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
      const artistNet = data.total_rate ? data.total_rate * (data.split_ratio || 0.85) : 0;
      const clientNet = data.total_rate || 0;
      
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
            <FormField
              control={form.control}
              name="total_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Rate (£)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="150.00" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <div className="text-sm font-medium text-muted-foreground mr-2 self-center">Quick Commission:</div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => applyPreset(0.85)}
                >
                  15% Commission
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => applyPreset(0.925)}
                >
                  7.5% Commission
                </Button>
                {defaultSplit !== 0.85 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => applyPreset(defaultSplit)}
                    className="border-2 border-primary"
                  >
                    Default ({Math.round((1 - defaultSplit) * 100)}% Comm.)
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={calculationMode === 'split' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalculationMode('split')}
                >
                  Split Ratio
                </Button>
                <Button
                  type="button"
                  variant={calculationMode === 'commission' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalculationMode('commission')}
                >
                  Commission %
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={saveDefaultSplit}
                  className="ml-auto"
                >
                  Save as Default
                </Button>
              </div>
            </div>

            {calculationMode === 'commission' ? (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="text-sm font-medium mb-2">Commission Calculator</div>
                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Commission % (Agency)</FormLabel>
                    <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="15.0"
                      onChange={(e) => {
                        const commission = parseFloat(e.target.value) || 15;
                        const splitRatio = (100 - commission) / 100;
                        form.setValue('split_ratio', Math.min(Math.max(splitRatio, 0.5), 0.95));
                      }}
                      defaultValue="15"
                    />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Artist % (Calculated)</FormLabel>
                    <Input 
                      type="number" 
                      value={(form.watch('split_ratio') * 100).toFixed(1)}
                      disabled
                      className="bg-muted"
                    />
                  </FormItem>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="split_ratio"
                render={({ field }) => {
                  const totalRate = form.watch('total_rate') || 0;
                  const artistAmount = totalRate * (field.value || 0.85);
                  
                  return (
                    <FormItem>
                      <FormLabel>Artist Amount (£)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          value={artistAmount.toFixed(2)}
                          onChange={(e) => {
                            const newArtistAmount = parseFloat(e.target.value) || 0;
                            const newRatio = totalRate > 0 ? newArtistAmount / totalRate : 0.85;
                            field.onChange(Math.min(Math.max(newRatio, 0.5), 0.95));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="split_ratio"
                render={({ field }) => {
                  const percentage = (field.value || 0.85) * 100;
                  
                  return (
                    <FormItem>
                      <FormLabel>Artist % (Direct)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="85.0"
                          value={percentage.toFixed(1)}
                          onChange={(e) => {
                            const newPercentage = parseFloat(e.target.value) || 85;
                            field.onChange(Math.min(Math.max(newPercentage / 100, 0.5), 0.95));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="split_ratio"
                render={({ field }) => {
                  const totalRate = form.watch('total_rate') || 0;
                  const agencyAmount = totalRate * (1 - (field.value || 0.85));
                  
                  return (
                    <FormItem>
                      <FormLabel>Agency Amount (£)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          value={agencyAmount.toFixed(2)}
                          onChange={(e) => {
                            const newAgencyAmount = parseFloat(e.target.value) || 0;
                            const newRatio = totalRate > 0 ? 1 - (newAgencyAmount / totalRate) : 0.85;
                            field.onChange(Math.min(Math.max(newRatio, 0.5), 0.95));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormItem>
                <FormLabel>Agency % (Calculated)</FormLabel>
                <Input 
                  type="number" 
                  value={((1 - (form.watch('split_ratio') || 0.85)) * 100).toFixed(1)}
                  disabled
                  className="bg-muted"
                />
              </FormItem>
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
                        {...field}
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
                        {...field}
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
                <CardTitle className="text-sm">Fee Split Summary (with VAT)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Artist Net:</span>
                  <span>{formatGBP((preview as any).artist)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Artist VAT ({form.watch('vat_rate_artist')}%):</span>
                  <span>{formatGBP((preview as any).artistVat || 0)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Artist Total:</span>
                  <span>{formatGBP((preview as any).artistTotal || 0)}</span>
                </div>
                
                <div className="border-t pt-2 mt-2" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Agency Net:</span>
                  <span>{formatGBP((preview as any).agency)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Agency VAT ({form.watch('vat_rate_client')}%):</span>
                  <span>{formatGBP((preview as any).agencyVat || 0)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Agency Total:</span>
                  <span>{formatGBP((preview as any).agencyTotal || 0)}</span>
                </div>
                
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  {Math.round((form.watch('split_ratio') || 0.85) * 100)}% / {Math.round((1 - (form.watch('split_ratio') || 0.85)) * 100)}% split
                  • Commission: {Math.round((1 - (form.watch('split_ratio') || 0.85)) * 100)}%
                </div>
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
