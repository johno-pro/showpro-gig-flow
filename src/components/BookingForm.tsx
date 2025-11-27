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
    defaultValues: {
      arrival_time: new Date(new Date().setHours(18, 0