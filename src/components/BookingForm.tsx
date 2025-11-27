import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { formatGBP } from '@/lib/utils';

const bookingSchema = z.object({
  artist_id: z.string().optional(),
  venue_id: z.string().optional(),
  client_id: z.string().optional(),
  arrival_time: z.date().optional(),
  performance_range: z.object({ from: z.date().optional(), to: z.date().optional() }).optional(),
  total_rate: z.number().optional(),
  split_ratio: z.number().min(0.5).max(0.95).default(0.85),
  notes: z.string().optional(),
  status: z.enum(['draft', 'pending', 'paid']).default('draft'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function BookingForm({ defaultValues, onSuccess }: { defaultValues?: Partial<BookingFormData>; onSuccess?: () => void }) {
  const [venues, setVenues] = useState([]);
  const [artists, setArtists] = useState([]);
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({ artist: 0, agency: 0 });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    // Set same-date defaults on load
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Start of day

    form.setValue('arrival_time', new Date(today.setHours(18, 0, 0, 0)));  // 6pm same day
    const perfFrom = new Date(today.setHours(19, 0, 0, 0));  // 7pm same day
    const perfTo = new Date(perfFrom.setHours(23, 30, 0, 0));  // 11:30pm same day
    form.setValue('performance_range', { from: perfFrom, to: perfTo });

    // Fetch dropdowns
    supabase.from('venues').select('id, name').order('name').then(({ data }) => setVenues(data || []));
    supabase.from('artists').select('id, name').order('name').then(({ data }) => setArtists(data || []));
    supabase.from('clients').select('id, name').order('name').then(({ data }) => setClients(data || []));
  }, []);

  useEffect(() => {
    const { split_ratio, total_rate } = form.watch();
    setPreview({ artist: total_rate * split_ratio, agency: total_rate * (1 - split_ratio) });
  }, [form.watch('split_ratio'), form.watch('total_rate')]);

  const handleSaveDraft = async () => {
    setSaving(true);
    const values = form.getValues();
    values.status = 'draft';
    const { error } = await supabase.from('bookings').upsert(values);
    toast[error ? 'error' : 'success'](error ? 'Draft failed' : 'Auto-saved draft!');
    setSaving(false);
  };

  useEffect(() => {
    const sub = form.watch((value) => {
      if (Object.values(value).some(v => v !== '' && v !== undefined)) {
        const timer = setTimeout(handleSaveDraft, 2000);
        return () => clearTimeout(timer);
      }
    });
    return () => sub.unsubscribe();
  }, [form.watch()]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      data.status = 'pending';
      const { data: result, error } = await supabase.from('bookings').insert(data);
      if (error) throw error;
      toast.success('Booking created!');
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="times">Times</TabsTrigger>
          <TabsTrigger value="money">Money</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <FormField name="artist_id" render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>Artist</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select artist" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {artists.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="venue_id" render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>Venue</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {venues.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="client_id" render={({ field }) => (
            <FormItem className="mb-
