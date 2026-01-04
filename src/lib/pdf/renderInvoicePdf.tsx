import React from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePdf } from "./InvoicePdf";
import type { InvoicePdfModel } from "./types";

/**
 * Renders an invoice PDF and returns it as a Blob
 */
export async function renderInvoicePdf(model: InvoicePdfModel): Promise<Blob> {
  const document = <InvoicePdf model={model} />;
  const blob = await pdf(document).toBlob();
  return blob;
}

/**
 * Renders and downloads an invoice PDF
 */
export async function downloadInvoicePdf(
  model: InvoicePdfModel,
  filename?: string
): Promise<void> {
  const blob = await renderInvoicePdf(model);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `invoice-${model.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Renders and opens an invoice PDF in a new tab
 */
export async function openInvoicePdf(model: InvoicePdfModel): Promise<void> {
  const blob = await renderInvoicePdf(model);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

/**
 * Renders an invoice PDF and returns it as a blob URL for in-app preview
 */
export async function getInvoicePdfPreviewUrl(model: InvoicePdfModel): Promise<string> {
  const blob = await renderInvoicePdf(model);
  return URL.createObjectURL(blob);
}
