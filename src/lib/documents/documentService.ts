import { supabase } from "@/integrations/supabase/client";

export type DocType = "invoice" | "confirmation" | "remittance" | "other";

export interface SaveDocumentParams {
  blob: Blob;
  jobNumber: string;
  docType: DocType;
  bookingId?: string;
  invoiceId?: string;
  invoiceBatchId?: string;
  invoiceNumber?: string;
  isVar?: boolean;
}

export interface Document {
  id: string;
  booking_id: string | null;
  invoice_id: string | null;
  invoice_batch_id: string | null;
  doc_type: string;
  filename: string;
  storage_path: string;
  job_number: string;
  created_at: string;
  created_by: string | null;
}

/**
 * Generate a filename for a document based on job number
 * Single invoice: JOBNUMBER-INVOICE-INVOICENO.pdf (e.g., 5517-INVOICE-5517_ELLA.pdf)
 * VAR invoice: FIRSTJOBNO-INVOICE-FIRSTJOBNO_VAR.pdf (e.g., 4641-INVOICE-4641_VAR.pdf)
 */
export function generateDocumentFilename(
  jobNumber: string,
  docType: DocType,
  invoiceNumber?: string,
  isVar?: boolean
): string {
  const sanitizedJobNumber = jobNumber.replace(/[^a-zA-Z0-9_/-]/g, "");
  
  switch (docType) {
    case "invoice":
      if (isVar) {
        return `${sanitizedJobNumber}-INVOICE-${sanitizedJobNumber}_VAR.pdf`;
      }
      const sanitizedInvoiceNo = invoiceNumber?.replace(/[^a-zA-Z0-9_/-]/g, "") || sanitizedJobNumber;
      return `${sanitizedJobNumber}-INVOICE-${sanitizedInvoiceNo}.pdf`;
    case "confirmation":
      return `${sanitizedJobNumber}-CONFIRMATION.pdf`;
    case "remittance":
      return `${sanitizedJobNumber}-REMITTANCE.pdf`;
    default:
      return `${sanitizedJobNumber}-DOCUMENT.pdf`;
  }
}

/**
 * Save a PDF document to Supabase Storage and track it in the documents table
 */
export async function saveDocument(params: SaveDocumentParams): Promise<{ success: boolean; error?: string; document?: Document }> {
  const { blob, jobNumber, docType, bookingId, invoiceId, invoiceBatchId, invoiceNumber, isVar } = params;

  // Validate job number
  if (!jobNumber || jobNumber.trim() === "") {
    return { success: false, error: "Cannot save document: Job number is required" };
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in to save documents" };
  }

  // Generate filename and storage path
  const filename = generateDocumentFilename(jobNumber, docType, invoiceNumber, isVar);
  const storagePath = `${docType}s/${new Date().getFullYear()}/${filename}`;

  try {
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, blob, {
        contentType: "application/pdf",
        upsert: true, // Allow overwriting if re-saving
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, error: `Failed to upload: ${uploadError.message}` };
    }

    // Check if document already exists for this booking/invoice
    let existingDocQuery = supabase
      .from("documents")
      .select("id")
      .eq("doc_type", docType);

    if (bookingId) {
      existingDocQuery = existingDocQuery.eq("booking_id", bookingId);
    }
    if (invoiceBatchId) {
      existingDocQuery = existingDocQuery.eq("invoice_batch_id", invoiceBatchId);
    }

    const { data: existingDocs } = await existingDocQuery;

    let document: Document;

    if (existingDocs && existingDocs.length > 0) {
      // Update existing document record
      const { data, error: updateError } = await supabase
        .from("documents")
        .update({
          filename,
          storage_path: storagePath,
          job_number: jobNumber,
        })
        .eq("id", existingDocs[0].id)
        .select()
        .single();

      if (updateError) {
        console.error("Document update error:", updateError);
        return { success: false, error: `Failed to update document record: ${updateError.message}` };
      }
      document = data as Document;
    } else {
      // Insert new document record
      const { data, error: insertError } = await supabase
        .from("documents")
        .insert({
          booking_id: bookingId || null,
          invoice_id: invoiceId || null,
          invoice_batch_id: invoiceBatchId || null,
          doc_type: docType,
          filename,
          storage_path: storagePath,
          job_number: jobNumber,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Document insert error:", insertError);
        return { success: false, error: `Failed to save document record: ${insertError.message}` };
      }
      document = data as Document;
    }

    return { success: true, document };
  } catch (err: any) {
    console.error("Save document error:", err);
    return { success: false, error: err.message || "Unknown error occurred" };
  }
}

/**
 * Get a signed URL for a document in storage
 */
export async function getDocumentSignedUrl(storagePath: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error("Failed to get signed URL:", error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Fetch all documents for a booking
 */
export async function getBookingDocuments(bookingId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch documents:", error);
    return [];
  }

  return (data || []) as Document[];
}

/**
 * Fetch all documents for an invoice batch
 */
export async function getInvoiceBatchDocuments(batchId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("invoice_batch_id", batchId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch documents:", error);
    return [];
  }

  return (data || []) as Document[];
}

/**
 * Delete a document from storage and database
 */
export async function deleteDocument(documentId: string, storagePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([storagePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
