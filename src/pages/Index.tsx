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
