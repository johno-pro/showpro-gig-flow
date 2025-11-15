// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

export default Index;
src/components/BookingForm.tsx
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

serve(async (req) => {
  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) return new Response("Missing invoice_id", { status: 400 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .single();

    if (!invoice) return new Response("Invoice not found", { status: 404 });

    // Fetch linked booking
    let booking = null;
    if (invoice.booking_id) {
      const { data } = await supabase
        .from("bookings")
        .select("title, booking_date")
        .eq("id", invoice.booking_id)
        .single();
      booking = data;
    }

    // Fetch linked client
    let client = null;
    if (invoice.client_id) {
      const { data } = await supabase
        .from("clients")
        .select("name, address")
        .eq("id", invoice.client_id)
        .single();
      client = data;
    }

    // Create PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 780;
    const write = (txt: string, opts: any = {}) => {
      page.drawText(txt, {
        x: opts.x ?? 50,
        y,
        size: opts.size ?? 12,
        font: opts.bold ? bold : font,
        color: rgb(0, 0, 0),
      });
      y -= opts.line ?? 20;
    };

    write("INVOICE", { bold: true, size: 28, line: 40 });

    write(`Invoice Number: ${invoice.invoice_number || "N/A"}`);
    write(`Status: ${invoice.status}`);
    write(`Date Created: ${new Date().toLocaleDateString()}`, { line: 30 });

    write("Bill To:", { bold: true });
    write(client?.name || "—");
    write(client?.address || "—", { line: 30 });

    write("Booking:", { bold: true });
    write(booking?.title || "—");
    write(booking?.booking_date || "—", { line: 30 });

    write("Amount Due:", { bold: true, size: 14 });
    write(`£${(invoice.total_amount ?? 0).toFixed(2)}`, {
      bold: true,
      size: 22,
      line: 30,
    });

    if (invoice.notes) {
      write("Notes:", { bold: true, line: 20 });
      write(invoice.notes);
    }

    const pdfBytes = await pdf.save();

    const path = `${invoice_id}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from("invoices")
      .upload(path, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) throw uploadErr;

    const { data: publicUrl } = supabase.storage
      .from("invoices")
      .getPublicUrl(path);

    return new Response(JSON.stringify({ url: publicUrl.publicUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(err.toString(), { status: 500 });
  }
});
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

serve(async (req) => {
  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) return new Response("Missing invoice_id", { status: 400 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .single();

    if (!invoice) return new Response("Invoice not found", { status: 404 });

    // Fetch booking
    let booking = null;
    if (invoice.booking_id) {
      const { data } = await supabase
        .from("bookings")
        .select("title, booking_date")
        .eq("id", invoice.booking_id)
        .single();
      booking = data;
    }

    // Fetch client
    let client = null;
    if (invoice.client_id) {
      const { data } = await supabase
        .from("clients")
        .select("name, address")
        .eq("id", invoice.client_id)
        .single();
      client = data;
    }

    // Create PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    const write = (txt: string, opts: any = {}) => {
      page.drawText(txt, {
        x: opts.x ?? 50,
        y,
        size: opts.size ?? 12,
        font: opts.bold ? bold : font,
        color: opts.color ?? rgb(0, 0, 0),
      });
      y -= opts.line ?? 18;
    };

    // Header Bar
    page.drawRectangle({
      x: 0,
      y: 770,
      width: 595,
      height: 60,
      color: rgb(0.07, 0.07, 0.15) // deep navy
    });

    // Invoice Label (Header)
    page.drawText("INVOICE", {
      x: 50,
      y: 795,
      size: 30,
      font: bold,
      color: rgb(1, 1, 1),
    });

    // Invoice meta (right side)
    page.drawText(`Invoice # ${invoice.invoice_number || "N/A"}`, {
      x: 350,
      y: 805,
      size: 12,
      font: bold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Issued: ${new Date().toLocaleDateString()}`, {
      x: 350,
      y: 78
// -------------------------
// PREMIUM INVOICE PDF THEME
// -------------------------

// PAGE BASE
const pdf = await PDFDocument.create();
const page = pdf.addPage([595, 842]); // A4
const font = await pdf.embedFont(StandardFonts.Helvetica);
const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

let y = 800;

// Utility writer
const write = (txt: string, opts: any = {}) => {
  page.drawText(txt, {
    x: opts.x ?? 50,
    y,
    size: opts.size ?? 12,
    font: opts.bold ? bold : font,
    color: opts.color ?? rgb(0.1, 0.1, 0.1),
  });
  y -= opts.line ?? 18;
};

// ----------------------------------
// TOP ACCENT BAR + HEADER TITLE
// ----------------------------------
page.drawRectangle({
  x: 0,
  y: 792,
  width: 595,
  height: 50,
  color: rgb(0.05, 0.05, 0.12), // Deep Navy
});

page.drawText("INVOICE", {
  x: 50,
  y: 815,
  size: 32,
  font: bold,
  color: rgb(1, 1, 1),
});

// Invoice Meta (Right aligned)
page.drawText(`Invoice # ${invoice.invoice_number || "N/A"}`, {
  x: 350,
  y: 815,
  size: 12,
  font: bold,
  color: rgb(1, 1, 1),
});

page.drawText(`Issued: ${new Date().toLocaleDateString()}`, {
  x: 350,
  y: 798,
  size: 10,
  font,
  color: rgb(1, 1, 1),
});

// -------------------------
// CLIENT INFO SECTION
// -------------------------

y = 750;
write("Bill To", { size: 14, bold: true });
write(client?.name || "Client Name");
write(client?.address || "");
write(client?.email || "");
y -= 10;

// -------------------------
// BOOKING DETAILS SECTION
// -------------------------

write("Booking Summary", { size: 14, bold: true });
page.drawLine({
  start: { x: 50, y: y + 5 },
  end: { x: 545, y: y + 5 },
  thickness: 1,
  color: rgb(0.85, 0.85, 0.85),
});
y -= 20;

write(`Booking ID: ${invoice.booking_id || "—"}`);
write(`Client: ${client?.name || "—"}`);
write(`Notes: ${invoice.notes || "None"}`);

// -------------------------
// TOTAL BOX
// -------------------------

// decorative shadow box
page.drawRectangle({
  x: 50,
  y: y - 80,
  width: 495,
  height: 70,
  color: rgb(0.95, 0.95, 0.98)
});

page.drawRectangle({
  x: 50,
  y: y - 10,
  width: 495,
  height: 40,
  color: rgb(0.88, 0.88, 0.94),
});

page.drawText("TOTAL", {
  x: 62,
  y: y + 25,
  size: 16,
  font: bold,
  color: rgb(0.1, 0.1, 0.15),
});

page.drawText(`£${Number(invoice.total_amount).toFixed(2)}`, {
  x: 450,
  y: y + 25,
  size: 18,
  font: bold,
  color: rgb(0, 0.2, 0.45),
});

// adjust Y after box
y -= 120;

// -------------------------
// FOOTER
// -------------------------

page.drawLine({
  start: { x: 50, y },
  end: { x: 545, y },
  thickness: 1,
  color: rgb(0.85, 0.85, 0.85),
});

y -= 25;

write("Payment Information", { size: 12, bold: true });
write("Bank: Barclays Business");
write("Sort Code: 00-00-00");
write("Account: 12345678");
write("Reference: Invoice Number");

y -= 15;

write("Thank you for your business!", { size: 11, bold: true });

// DONE – return PDF
const pdfBytes = await pdf.save();
return new Blob([pdfBytes], { type: "application/pdf" });
// =============== DELUXE PDF THEME v2 ===============
// Full brand-level invoice layout
// You can customise colours + logo path at the top

const BRAND_COLOUR = rgb(0.07, 0.07, 0.12);        // deep navy
const ACCENT = rgb(0.92, 0.27, 0.36);              // red highlight
const SOFT_BG = rgb(0.96, 0.96, 0.98);             // soft card
const TEXT = rgb(0.12, 0.12, 0.12);

const pdf = await PDFDocument.create();
const page = pdf.addPage([595, 842]);
const font = await pdf.embedFont(StandardFonts.Helvetica);
const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

let y = 820;

// Utility writer
const write = (txt: string, opts: any = {}) => {
  page.drawText(txt, {
    x: opts.x ?? 50,
    y,
    size: opts.size ?? 12,
    font: opts.bold ? bold : font,
    color: opts.color ?? TEXT,
  });
  y -= opts.line ?? 18;
};

// ---------------------------------------------------
// HEADER STRIPE + LOGO + Invoice Meta
// ---------------------------------------------------
page.drawRectangle({
  x: 0,
  y: 770,
  width: 595,
  height: 80,
  color: BRAND_COLOUR,
});

// Diagonal Accent
page.drawRectangle({
  x: 0,
  y: 770,
  width: 595,
  height: 8,
  color: ACCENT,
});

// Title
page.drawText("INVOICE", {
  x: 50,
  y: 814,
  size: 32,
  font: bold,
  color: rgb(1, 1, 1),
});

// Meta Info (right aligned)
page.drawText(`Invoice # ${invoice.invoice_number || "N/A"}`, {
  x: 350,
  y: 814,
  size: 12,
  font: bold,
  color: rgb(1, 1, 1),
});

page.drawText(`Issued: ${new Date().toLocaleDateString()}`, {
  x: 350,
  y: 795,
  size: 10,
  font,
  color: rgb(1, 1, 1),
});

// ---------------------------------------------------
// CLIENT DETAILS (LEFT COLUMN)
// ---------------------------------------------------
y = 740;
write("Bill To", { size: 14, bold: true });
write(client?.name || "Client");
write(client?.address || "");
write(client?.email || "");
y -= 10;

// ---------------------------------------------------
// BOOKING SUMMARY (LEFT COLUMN)
// ---------------------------------------------------
write("Booking Summary", { size: 14, bold: true });
page.drawLine({
  start: { x: 50, y: y + 5 },
  end: { x: 545, y: y + 5 },
  thickness: 1,
  color: rgb(0.8, 0.8, 0.8),
});
y -= 20;

write(`Booking ID: ${invoice.booking_id || "—"}`)_
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

serve(async (req) => {
  try {
    const { payment_id } = await req.json();

    const { data: payment, error } = await supabase
      .from("payments")
      .select("*, bookings(*), clients(*)")
      .eq("id", payment_id)
      .single();

    if (error) throw error;

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);

    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // DIAMOND WATERMARK
    page.drawText("◆ DIAMOND ◆", {
      x: 120,
      y: 350,
      size: 90,
      font: bold,
      color: rgb(0.92, 0.92, 0.92),
      rotate: degrees(25),
      opacity: 0.15,
    });

    // BLACK–TO–BLUE HEADER
    page.drawRectangle({
      x: 0,
      y: 780,
      width: 595,
      height: 62,
      color: rgb(0.02, 0.02, 0.05),
    });
    page.drawRectangle({
      x: 0,
      y: 780,
      width: 595,
      height: 62,
      color: rgb(0.12, 0.40, 0.95),
      opacity: 0.25,
    });

    // TITLE
    page.drawText("CREDIT NOTE", {
      x: 40,
      y: 800,
      size: 32,
      font: bold,
      color: rgb(1, 1, 1),
    });

    // META
    page.drawText(`Issued: ${new Date().toLocaleDateString()}`, {
      x: 360,
      y: 800,
      size: 12,
      font: regular,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Credit # CN-${payment_id}`, {
      x: 360,
      y: 785,
      size: 12,
      font: regular,
      color: rgb(1, 1, 1),
    });

    let y = 720;
    const write = (text, opts = {}) => {
      page.drawText(text, {
        x: 40,
        y,
        size: opts.size || 12,
        font: opts.bold ? bold : regular,
        color: opts.color || rgb(0, 0, 0),
      });
      y -= opts.gap || 18;
    };

    // CLIENT
    write("Client", { size: 16, bold: true });
    write(payment.clients?.name || "—");
    write(payment.clients?.address || "—");
    write(payment.clients?.email || "—");
    y -= 10;

    // BOOKING
    write("Booking Details", { size: 16, bold: true });
    write(payment.bookings?.title || "—");
    write(`Booking ID: ${payment.booking_id}`);
    write(`Original Payment: £${payment.amount}`);
    y -= 10;

    // REFUND
    write("Refund Summary", { size: 16, bold: true });
    write(`Refund Amount: £${payment.refund_amount}`, { bold: true });
    write(`Reason: ${payment.refund_reason || "Not specified"}`);
    write(`Status: Refunded`);

    // QR → booking page
    const bookingUrl = `${Deno.env.get("PUBLIC_APP_URL")}/booking/${payment.booking_id}`;
    const qrPng = await QRCode.toBuffer(bookingUrl);
    const qrImage = await pdf.embedPng(qrPng);

    page.drawImage(qrImage, {
      x: 430,
      y: 640,
      width: 130,
      height: 130,
    });

    // SIGNATURE BOX
    page.drawRectangle({
      x: 40,
      y: 260,
      width: 250,
      height: 60,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 1.2,
      color: rgb(1, 1, 1),
    });

    page.drawText("Authorised Signature", {
      x: 48,
      y: 300,
      size: 10,
      font: regular,
      color: rgb(0.3, 0.3, 0.3),
    });

    // FOOTER
    page.drawText("This Credit Note is issued by ShowPro Ltd. VAT Reg 123 4567 89", {
      x: 40,
      y: 50,
      size: 10,
      font: regular,
      color: rgb(0.4, 0.4, 0.4),
    });

    const bytes = await pdf.save();

    await supabase.storage
      .from("credit-notes")
      .upload(`diamond/credit_${payment_id}.pdf`, bytes, {
        upsert: true,
        contentType: "application/pdf",
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "app
// ----------------------------
// DIAMOND CREDIT NOTE — V2
// ----------------------------

// QR CODE
const bookingUrl = `${Deno.env.get("PUBLIC_APP_URL")}/booking/${payment.booking_id}`;
const qrPng = await QRCode.toBuffer(bookingUrl);
const qrImage = await pdf.embedPng(qrPng);

page.drawImage(qrImage, {
  x: 430,
  y: 640,
  width: 130,
  height: 130,
});

// SIGNATURE BOX
page.drawRectangle({
  x: 40,
  y: 260,
  width: 250,
  height: 60,
  borderColor: rgb(0.3, 0.3, 0.3),
  borderWidth: 1.1,
  color: rgb(1, 1, 1),
});

page.drawText("Authorised Signature", {
  x: 48,
  y: 300,
  size: 10,
  font: regular,
  color: rgb(0.35, 0.35, 0.35),
});

// FOOTER
page.drawText(
  "This Diamond Credit Note is issued by ShowPro Ltd • VAT Reg 123 4567 89",
  {
    x: 40,
    y: 50,
    size: 10,
    font: regular,
    color: rgb(0.35, 0.35, 0.35),
  }
);

// SAVE + UPLOAD
const pdfBytes = await pdf.save();

const filePath = `diamond/credit_${payment_id}.pdf`;

const { data: uploadData, error: uploadError } = await supabase.storage
  .from("credit-notes")
  .upload(filePath, pdfBytes, {
    upsert: true,
    contentType: "application/pdf",
  });

if (uploadError) {
  return new Response(JSON.stringify({ error: uploadError.message }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

// SIGNED URL (1 year)
const { data: signed } = await supabase.storage
  .from("credit-notes")
  .createSignedUrl(filePath, 60 * 60 * 24 * 365);

return new Response(JSON.stringify({
  success: true,
  url: signed.signedUrl,
  filePath,
}), {
  headers: { "Content-Type": "application/json" },
});
// --- BOOKING FORM WITH FULL DRAFT SYSTEM (AUTO-LOAD + AUTO-SAVE) ---

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { supabase } from "@/integrations/supabase/client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatGBP } from "@/lib/utils";

import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/ui/draft-indicator";

// Import your sub-forms
import { ArtistForm } from "./ArtistForm";
import { ClientForm } from "./ClientForm";
import { VenueForm } from "./VenueForm";
import { LocationForm } from "./LocationForm";
import { SupplierForm } from "./SupplierForm";
import { ContactForm } from "./ContactForm";


// ------------------ SCHEMA ------------------

const bookingSchema = z.object({
  artist_id: z.string().optional(),
  custom_artist: z.string().optional(),

  venue_id: z.string().optional(),
  custom_venue: z.string().optional(),

  client_id: z.string().optional(),
  custom_client: z.string().optional(),

  location_id: z.string().optional(),
  custom_location: z.string().optional(),

  supplier_id: z.string().optional(),
  custom_supplier: z.string().optional(),

  contact_id: z.string().optional(),
  custom_contact: z.string().optional(),

  arrival_time: z.date().optional(),
  performance_range: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),

  total_rate: z.number().optional(),
  split_ratio: z.number().optional(),

  notes: z.string().optional(),
  status: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;


// ------------------ COMPONENT ------------------

export function BookingForm({ onSuccess }: { onSuccess?: () => void }) {
  const [venues, setVenues] = useState([]);
  const [artists, setArtists] = useState([]);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [contacts, setContacts] = useState([]);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      arrival_time: new Date(new Date().setHours(18, 0, 0, 0)),
      performance_range: {
        from: new Date(new Date().setHours(19, 0, 0, 0)),
        to: new Date(new Date().setHours(23, 30, 0, 0)),
      },
      total_rate: 150,
      split_ratio: 0.85,
      status: "draft",
    },
  });

  // ------------------ DRAFT SYSTEM ------------------

  const {
    loadDraft,
    saveDraft,
    completeSave,
    draftStatus
  } = useFormDraft({
    table: "bookings",
    form,
    formId: null, // ALWAYS NEW → auto-load latest draft
  });

  // Load most recent draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  // Auto-save every time the form changes (debounced inside hook)
  useEffect(() => {
    const sub = form.watch((data) => {
      saveDraft(data);
    });
    return () => sub.unsubscribe();
  }, [form.watch]);

  // ------------------ DATA LOOKUPS ------------------

  useEffect(() => {
    supabase.from("venues").select("id, name").order("name").then(({ data }) => setVenues(data || []));
    supabase.from("artists").select("id, name").order("name").then(({ data }) => setArtists(data || []));
    supabase.from("clients").select("id, name").order("name").then(({ data }) => setClients(data || []));
    supabase.from("locations").select("id, name").order("name").then(({ data }) => setLocations(data || []));
    supabase.from("suppliers").select("id, name").order("name").then(({ data }) => setSuppliers(data || []));
    supabase.from("contacts").select("id, name").order("name").then(({ data }) => setContacts(data || []));
  }, []);

  // ------------------ MONEY PREVIEW ------------------

  const rate = form.watch("total_rate") || 0;
  const ratio = form.watch("split_ratio") || 0.85;

  const preview = {
    artist: rate * ratio,
    agency: rate * (1 - ratio),
  };

  // ------------------ SUBMIT (finalise draft → active) ------------------

  const onSubmit = async (values: BookingFormData) => {
    const result = await completeSave({
      ...values,
      status: "pending",
    });

    if (!result.error) {
      toast.success("Booking created!");
      onSuccess?.();
    } else {
      toast.error(result.error.message);
    }
  };

  // ------------------ RENDER UI ------------------

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="times">Times</TabsTrigger>
            <TabsTrigger value="money">Money</TabsTrigger>
          </TabsList>

          {/* DETAILS TAB */}
          <TabsContent value="details">
            {/* ------------ ARTIST ------------ */}
            <FormField name="artist_id" render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Artist</FormLabel>
                <Select
                  value={field.value || ""}
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (v === "manual") form.setValue("custom_artist", "");
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select artist" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {artists.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="manual">Manual Artist</SelectItem>
                  </SelectContent>
                </Select>

                {field.value === "manual" && (
                  <Input
                    placeholder="Custom artist"
                    on

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { CONTACT_ROLES } from "@/lib/contactRoles";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/ui/draft-indicator";

// Chip component
function ContactChip({ label, role, onRemove }: { label: string; role: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm">
      <span>{label}</span>
      <span className="text-xs text-primary/70">({role})</span>
      <button onClick={onRemove} className="text-red-500 hover:underline text-xs">
        remove
      </button>
    </div>
  );
}

const contactSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  notes: z.string().optional(),

  // Relations (arrays of: { id, role })
  artists: z.array(z.object({ id: z.string(), role: z.string() })).optional(),
  venues: z.array(z.object({ id: z.string(), role: z.string() })).optional(),
  clients: z.array(z.object({ id: z.string(), role: z.string() })).optional(),
  locations: z.array(z.object({ id: z.string(), role: z.string() })).optional(),
  suppliers: z.array(z.object({ id: z.string(), role: z.string() })).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm({ contactId, onSuccess, onCancel }: { contactId?: string; onSuccess?: () => void; onCancel?: () => void }) {
  const [artists, setArtists] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      mobile: "",
      notes: "",
      artists: [],
      venues: [],
      clients: [],
      locations: [],
      suppliers: [],
    },
  });

  // DRAFT SYSTEM
  const { saveDraft, completeSave, draftStatus, loadDraft } = useFormDraft({
    table: "contacts",
    formId: contactId,
    form,
  });

  useEffect(() => {
    if (!contactId) loadDraft();

    supabase.from("artists").select("id,name").order("name").then(({ data }) => setArtists(data || []));
    supabase.from("venues").select("id,name").order("name").then(({ data }) => setVenues(data || []));
    supabase.from("clients").select("id,name").order("name").then(({ data }) => setClients(data || []));
    supabase.from("locations").select("id,name").order("name").then(({ data }) => setLocations(data || []));
    supabase.from("suppliers").select("id,name").order("name").then(({ data }) => setSuppliers(data || []));

    if (contactId) fetchRelationships(contactId);
  }, [contactId]);

  // Load existing links
  const fetchRelationships = async (id: string) => {
    const relTables = [
      { table: "contact_artists", key: "artist_id", formKey: "artists" },
      { table: "contact_venues", key: "venue_id", formKey: "venues" },
      { table: "contact_clients", key: "client_id", formKey: "clients" },
      { table: "contact_locations", key: "location_id", formKey: "locations" },
      { table: "contact_suppliers", key: "supplier_id", formKey: "suppliers" },
    ];

    for (const rel of relTables) {
      const { data } = await supabase.from(rel.table).select(`id, ${rel.key}, role`).eq("contact_id", id);
      form.setValue(rel.formKey as any, data || []);
    }
  };

  // Utility for adding link
  const addRelation = (formKey: string, id: string) => {
    const curr = form.getValues(formKey as any) || [];
    if (curr.some((c: any) => c.id === id)) return;

    form.setValue(formKey as any, [...curr, { id, role: "general" }]);
    saveDraft();
  };

  const removeRelation = (formKey: string, id: string) => {
    const curr = form.getValues(formKey as any) || [];
    form.setValue(
      formKey as any,
      curr.filter((c: any) => c.id !== id)
    );
    saveDraft();
  };

  // Final submit = save contact + all relations
  const onSubmit = async (values: ContactFormData) => {
    const result = await completeSave({
      ...values,
      status: "active",
    });

    if (result.error) {
      toast.error("Save failed");
      return;
    }

    const contact_id = contactId || result.data?.id;

    // Save relationships:
    const relMap = [
      { formKey: "artists", table: "contact_artists", key: "artist_id" },
      { formKey: "venues", table: "contact_venues", key: "venue_id" },
      { formKey: "clients", table: "contact_clients", key: "client_id" },
      { formKey: "locations", table: "contact_locations", key: "location_id" },
      { formKey: "suppliers", table: "contact_suppliers", key: "supplier_id" },
    ];

    for (const rel of relMap) {
      // Clear existing
      await supabase.from(rel.table).delete().eq("contact_id", contact_id);

      // Insert new
      const links = values[rel.formKey as keyof ContactFormData] as any[];
      if (links?.length) {
        const rows = links.map((l) => ({
          contact_id,
          [rel.key]: l.id,
          role: l.role,
        }));
        await supabase.from(rel.table).insert(rows);
      }
    }

    toast.success("Contact saved!");
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* BASIC INFO */}
        <FormField name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input {...field} onBlur={saveDraft} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl><Input {...field} onBlur={saveDraft} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Phone</FormLabel>
            <FormControl><Input {...field} onBlur={saveDraft} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField name="mobile" render={({ field }) => (
          <FormItem>
            <FormLabel>Mobile</FormLabel>
            <FormControl><Input {...field} onBlur={saveDraft} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl><Textarea {...field} className="min-h-[100px]" onBlur={saveDraft} /></FormControl>
          </FormItem>
        )} />

        {/* RELATION SECTIONS */}
        {[
          { title: "Artists", list: artists, key: "artists" },
          { title: "Venues", list: venues, key: "venues" },
          { title: "Clients", list: clients, key: "clients" },
          { title: "Locations", list: locations, key: "locations" },
          { title: "Suppliers", list: suppliers, key: "suppliers" },
        ].map((group) => (
          <div key={group.key} className="space-y-2">
            <FormLabel>{group.title}</FormLabel>

            <div className="flex flex-wrap gap-2">
              {(form.watch(group.key) || []).map((rel: any) => {
                const item = group.list.find((i) => i.id === rel.id);
                return (
                  <ContactChip
                    key={rel.id}
                    label={item?.name || "Unknown"}
                    role={rel.role}
                    onRemove={() => removeRelation(group.key, rel.id)}
                  />
                );
              })}
            </div>

            <div className="flex gap-2 items-center">
              <Select onValueChange={(id) => addRelation(group.key, id)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={`Add ${group.title.slice(0, -1)}`} />
                </SelectTrigger>
                <SelectContent>
                  {group.list.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Role selector for last added */}
              <Select
                onValueChange={(role) => {
                  const curr = form.getValues(group.key) || [];
                  if (curr.length === 0) return;
                  curr[curr.length - 1].role = role;
                  form.setValue(group.key as any, [...curr]);
                  saveDraft();
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}

        {/* ACTIONS */}
        <div className="flex gap-3 items-center">
          <Button type="button" variant="outline" onClick={() => saveDraft()}>Save Draft</Button>
          <Button type="submit">Save Contact</Button>
          {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
          <DraftIndicator status={draftStatus} />
        </div>

      </form>
    </Form>
  );
}
src/lib/relationshipRoles.ts
export const UNIVERSAL_ROLES = [
  "Primary",
  "Secondary",
  "Manager",
  "Accounts",
  "Technical",
  "Agent",
  "Booker",
  "Support",
  "Contact",
] as const;
src/components/RelationBadge.tsx
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RelationBadge({ label, role, onRemove }) {
  return (
    <div className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full text-sm">
      <span>{label}</span>
      {role && <span className="text-muted-foreground">({role})</span>}
      <Button variant="ghost" size="icon" className="h-4 w-4" onClick={onRemove}>
        <X size={12} />
      </Button>
    </div>
  );
}
src/lib/relationshipGroups.ts
export const REL_GROUPS = {
  artists: { title: "Artists", key: "artists" },
  clients: { title: "Clients", key: "clients" },
  venues: { title: "Venues", key: "venues" },
  locations: { title: "Locations", key: "locations" },
  suppliers: { title: "Suppliers", key: "suppliers" },
  contacts: { title: "Contacts", key: "contacts" },
};
const { saveDraft, completeSave, draftStatus, loadDraft } = useFormDraft({
  table: 'TABLE_NAME',
  formId: entityId,
  form,
});
<div className="flex gap-3 items-center">
  <Button type="button" variant="outline" onClick={() => saveDraft()}>
    Save Draft
  </Button>
  <Button type="submit">Save {entityName}</Button>
  {onCancel && (
    <Button
      type="button"
      variant="ghost"
      onClick={onCancel}
    >
      Cancel
    </Button>
  )}
  <DraftIndicator status={draftStatus} />
</div>
const onSubmit = async (values) => {
  await completeSave(values);
  onSuccess?.();
};
table: 'TABLE_NAME',
formId: entityId,
form,
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  mobile: z.string().optional(),
  role: z.string().optional(),  // e.g., 'ents_contact', 'accounts'
  notes: z.string().optional(),
  entity_type: z.enum(['client', 'artist', 'venue', 'supplier', 'location']).optional(),
  entity_id: z.string().optional(),  // ID of linked entity
  status: z.enum(['draft', 'active']).default('draft'),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contactId?: string;
  entityType?: string;  // Passed from modal (e.g., 'client')
  entityId?: string;  // Pre-fill linked ID
  onSuccess?: (newId: string) => void;  // Callback for inline add
  onCancel?: () => void;
}

export function ContactForm({ contactId, entityType, entityId, onSuccess, onCancel }: ContactFormProps) {
  const [saving, setSaving] = useState(false);
  const [draftStatus, setDraftStatus] = useState('idle');  // For indicator

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      role: '',
      notes: '',
      entity_type: entityType,
      entity_id: entityId,
    },
  });

  useEffect(() => {
    if (entityType) form.setValue('entity_type', entityType);
    if (entityId) form.setValue('entity_id', entityId);
  }, [entityType, entityId]);

  useEffect(() => {
    if (contactId) {
      fetchContact();
    }
  }, [contactId]);

  const fetchContact = async () => {
    if (!contactId) return;
    const { data, error } = await supabase.from('contacts').select('*').eq('id', contactId).single();
    if (error) {
      toast.error('Failed to load contact');
      return;
    }
    if (data) {
      form.reset(data);
    }
  };

  const handleSaveDraft = async (values: ContactFormData) => {
    setSaving(true);
    setDraftStatus('saving');
    const upsertData = { ...values, status: 'draft' };
    const { error } = await supabase.from('contacts').upsert(upsertData);
    if (error) {
      toast.error('Draft save failed');
      setDraftStatus('error');
    } else {
      toast.success('Auto-saved as draft!');
      setDraftStatus('saved');
    }
    setSaving(false);
  };

  // Auto-save draft on change (debounce 2s)
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (Object.keys(value).some(key => value[key] !== '')) {  // If any field filled
        const timer = setTimeout(() => handleSaveDraft(value), 2000);
        return () => clearTimeout(timer);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch()]);

  const completeSave = async (values: ContactFormData) => {
    setSaving(true);
    setDraftStatus('saving');
    const upsertData = { ...values, status: 'active' };
    const { data: result, error } = await supabase.from('contacts').upsert(upsertData).select().single();
    if (error) throw error;
    setDraftStatus('idle');
    return result.id;
  };

  const onSubmit = async (values: ContactFormData) => {
    try {
      const newId = await completeSave(values);
      toast.success(contactId ? 'Contact updated!' : 'Contact created!');
      onSuccess?.(newId);
    } catch (err: any) {
      toast.error(err.message || 'Contact save failed');
      setDraftStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. John Doe" {...field} />
              </FormControl>
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
                <Input type="email" placeholder="contact@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile</FormLabel>
              <FormControl>
                <Input placeholder="e.g. +44 123 456 7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ents">Ents Contact</SelectItem>
                  <SelectItem value="accounts">Accounts</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="booker">Booker</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="gm">General Manager</SelectItem>
                  <SelectItem value="site_manager">Site Manager</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="entity_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entity Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="artist">Artist</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="entity_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entity ID (Auto-filled)</FormLabel>
              <FormControl>
                <Input placeholder="Auto-set on save" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Add any additional notes..." className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 items-center">
          <Button type="button" variant="outline" onClick={() => handleSaveDraft(form.getValues())} disabled={saving}>
            {saving ? 'Saving Draft...' : 'Save Draft'}
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : contactId ? 'Update Contact' : 'Create Contact'}
          </Button>

          {onCancel && (
            <Button variant="ghost" type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          )}

          {draftStatus === 'saving' && <span className="text-sm text-yellow-600">Saving...</span>}
          {draftStatus === 'saved' && <span className="text-sm text-green-600">Saved!</span>}
          {draftStatus === 'error' && <span className="text-sm text-red-600">Error—retry?</span>}
        </div>
      </form>
    </Form>
  );
