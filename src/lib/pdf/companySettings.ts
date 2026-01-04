import { supabase } from "@/integrations/supabase/client";
import type { InvoicePdfModel } from "./types";

export interface CompanySettingsForPdf {
  companyName: string;
  companyNo: string;
  vatNo: string;
  companyAddress: string[];
  bankSortCode: string;
  bankAccountNo: string;
  bankAccountName: string;
}

/**
 * Fetches company settings from the database and returns them formatted for PDF generation
 */
export async function getCompanySettingsForPdf(): Promise<CompanySettingsForPdf> {
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    // Fallback to defaults if settings can't be fetched
    console.warn("Could not fetch company settings, using defaults:", error);
    return {
      companyName: "ENTS PRO LTD",
      companyNo: "5591161",
      vatNo: "GB278282957",
      companyAddress: ["28 Grafton Drive", "Southport", "PR8 2RN"],
      bankSortCode: "04-00-03",
      bankAccountNo: "54019533",
      bankAccountName: "ENTS PRO LTD",
    };
  }

  // Parse registered address into lines
  const addressLines = data.registered_address
    ? data.registered_address.split(/[,\n]+/).map((line: string) => line.trim()).filter(Boolean)
    : [];

  return {
    companyName: data.company_name || "ENTS PRO LTD",
    companyNo: data.company_number || "",
    vatNo: data.vat_number || "",
    companyAddress: addressLines.length > 0 ? addressLines : [""],
    bankSortCode: data.bank_sort_code || "",
    bankAccountNo: data.bank_account_number || "",
    bankAccountName: data.bank_account_name || "",
  };
}

/**
 * Creates base InvoicePdfModel with company settings pre-filled
 */
export async function createBasePdfModel(): Promise<Pick<
  InvoicePdfModel,
  "companyName" | "companyNo" | "vatNo" | "companyAddress" | "bankSortCode" | "bankAccountNo" | "bankAccountName" | "billFrom"
>> {
  const settings = await getCompanySettingsForPdf();
  
  return {
    companyName: settings.companyName,
    companyNo: settings.companyNo,
    vatNo: settings.vatNo,
    companyAddress: settings.companyAddress,
    bankSortCode: settings.bankSortCode,
    bankAccountNo: settings.bankAccountNo,
    bankAccountName: settings.bankAccountName,
    billFrom: {
      name: settings.companyName,
      address: settings.companyAddress,
    },
  };
}
