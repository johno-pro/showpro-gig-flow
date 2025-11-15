import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, X } from "lucide-react";
import { sanitizeText, sanitizeFileName } from "@/lib/sanitize";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/ui/draft-indicator";
import { MultiSelect } from "@/components/ui/multi-select";
import { useEntityContacts } from "@/hooks/useEntityContacts";

const artistFormSchema = z.object({
  name: z.string().trim().optional(),
  full_name: z.string().trim().optional(),
  act_type: z.string().trim().optional(),
  supplier_id: z.string().optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  invoice_upload_url: z.string().optional(),
  buy_fee: z.string().optional(),
  sell_fee: z.string().optional(),
  vat_rate: z.string().optional(),
  notes: z.string().trim().optional(),
});

type ArtistFormValues = z.infer<typeof artistFormSchema>;

interface ArtistFormProps {
  artistId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ArtistForm({ artistId, onSuccess, onCancel }: ArtistFormProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [existingInvoiceUrl, setExistingInvoiceUrl] = useState<string | null>(null);

  const {
    contacts,
    selectedContactIds,
    setSelectedContactIds,
    saveEntityContacts,
  } = useEntityContacts("artist", artistId);

  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: "",
      full_name: "",
      act_type: "",
      supplier_id: "",
      email: "",
      phone: "",
      invoice_upload_url: "",
      buy_fee: "",
      sell_fee: "",
      vat_rate: "20",
      notes: "",
    },
  });

  const { saveDraft, completeSave, draftStatus } = useFormDraft({
    table: "artists",
    formId: artistId,
    form,
  });

  useEffect(() => {
    fetchSuppliers();
    if (artistId) {
      fetchArtist();
    }
  }, [artistId]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchArtist = async () => {
    if (!artistId) return;

    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("id", artistId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        form.reset({
          name: data.name,
          full_name: data.full_name || "",
          act_type: data.act_type || "",
          supplier_id: data.supplier_id || "",
          email: data.email || "",
          phone: data.phone || "",
          invoice_upload_url: data.invoice_upload_url || "",
          buy_fee: data.buy_fee?.toString() || "",
          sell_fee: data.sell_fee?.toString() || "",
          vat_rate: data.vat_rate?.toString() || "20",
          notes: data.notes || "",
        });
        setExistingInvoiceUrl(data.invoice_upload_url);
      }
    } catch (error) {
      toast.error("Failed to load artist");
      console.error(error);
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF and image files (JPG, PNG) are allowed");
        return null;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const sanitizedOriginalName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('artist-invoices')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artist-invoices')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      toast.error("Failed to upload file");
      return null;
    }
  };

  const onSubmit = async (values: ArtistFormValues) => {
    setLoading(true);
    try {
      let invoiceUrl = values.invoice_upload_url || null;

      // Handle file upload if a new file is selected
      if (uploadedFile) {
        const uploadedUrl = await handleFileUpload(uploadedFile);
        if (uploadedUrl) {
          invoiceUrl = uploadedUrl;
        }
      }

      const artistData = {
        name: sanitizeText(values.name, 200),
        full_name: values.full_name ? sanitizeText(values.full_name, 200) : null,
        act_type: values.act_type ? sanitizeText(values.act_type, 100) : null,
        supplier_id: values.supplier_id || null,
        email: values.email ? sanitizeText(values.email, 255) : null,
        phone: values.phone ? sanitizeText(values.phone, 20) : null,
        invoice_upload_url: invoiceUrl,
        buy_fee: values.buy_fee ? parseFloat(values.buy_fee) : null,
        sell_fee: values.sell_fee ? parseFloat(values.sell_fee) : null,
        vat_rate: values.vat_rate ? parseFloat(values.vat_rate) : null,
        notes: values.notes ? sanitizeText(values.notes, 2000) : null,
        status: "active",
      };

      let savedArtistId = artistId;

      if (artistId) {
        await completeSave(artistData as any);
      } else {
        const { data: newArtist, error } = await supabase
          .from("artists")
          .insert([artistData])
          .select()
          .single();

        if (error) throw error;
        savedArtistId = newArtist.id;
      }

      // Save contact relationships
      if (savedArtistId) {
        await saveEntityContacts(savedArtistId, selectedContactIds);
      }

      toast.success(artistId ? "Artist updated successfully" : "Artist created successfully");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save artist");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professional Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Stage or professional name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full legal name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="act_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Act Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Singer, Band, Comedian" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="artist@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tel Number</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-2">
            <FormItem>
              <FormLabel>Invoice Upload</FormLabel>
              <div className="space-y-2">
                {existingInvoiceUrl && !uploadedFile && (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm flex-1 truncate">{existingInvoiceUrl}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setExistingInvoiceUrl(null);
                        form.setValue("invoice_upload_url", "");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {uploadedFile && (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm flex-1 truncate">{uploadedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'application/pdf,image/jpeg,image/png,image/jpg';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error("File size must be less than 10MB");
                            return;
                          }
                          setUploadedFile(file);
                          setExistingInvoiceUrl(null);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Invoice
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, JPG, PNG (max 10MB)
                </p>
              </div>
            </FormItem>
          </div>

          <FormField
            control={form.control}
            name="buy_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buy Fee (£)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sell_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sell Fee (£)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vat_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VAT Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="20" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.watch("buy_fee") && form.watch("sell_fee") && (
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="text-sm font-medium">Calculated Profit</div>
            <div className="text-2xl font-bold">
              {(() => {
                const buyFee = parseFloat(form.watch("buy_fee") || "0");
                const sellFee = parseFloat(form.watch("sell_fee") || "0");
                if (buyFee > 0) {
                  return ((sellFee - buyFee) / buyFee * 100).toFixed(2) + "%";
                }
                return "N/A";
              })()}
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
                  placeholder="Add any additional notes about the artist..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Related Contacts</h3>
          <div>
            <label className="text-sm font-medium">Contacts</label>
            <p className="text-sm text-muted-foreground mb-2">
              Link contacts to this artist for communications and bookings.
            </p>
            <MultiSelect
              options={contacts.map((c) => ({ value: c.id, label: c.name }))}
              selected={selectedContactIds}
              onChange={setSelectedContactIds}
              placeholder="Select contacts..."
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <DraftIndicator status={draftStatus} />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => saveDraft()} disabled={loading}>
              Save Draft
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : artistId ? "Update Artist" : "Create Artist"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
