/**
 * Data model for rendering invoice PDFs
 */
export interface InvoiceLineItem {
  ref: string;
  date: string;
  description: string;
  net: number;
  vat: number;
  gross: number;
}

export interface InvoicePdfModel {
  // Company details
  companyName: string;
  companyNo: string;
  vatNo: string;
  companyAddress: string[];
  bankSortCode: string;
  bankAccountNo: string;
  bankAccountName: string;

  // Invoice header
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  poNumber?: string;
  isReissue?: boolean;
  isVar?: boolean;

  // Bill To
  billTo: {
    name: string;
    address: string[];
    vatNumber?: string;
  };

  // Bill From (your company)
  billFrom: {
    name: string;
    address: string[];
  };

  // Summary row
  summary: {
    artist: string;
    jobNo: string;
    venue: string;
  };

  // Line items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalDue: number;
}
