import { useState, useEffect } from "react";
import { useCompanySettings, useUpdateCompanySettings } from "@/hooks/useCompanySettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Building2, CreditCard, Mail, FileText } from "lucide-react";

export default function CompanySettings() {
  const { data: settings, isLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();

  const [formData, setFormData] = useState({
    company_name: "",
    registered_address: "",
    company_number: "",
    vat_number: "",
    accounts_email: "",
    bank_name: "",
    bank_account_name: "",
    bank_sort_code: "",
    bank_account_number: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || "",
        registered_address: settings.registered_address || "",
        company_number: settings.company_number || "",
        vat_number: settings.vat_number || "",
        accounts_email: settings.accounts_email || "",
        bank_name: settings.bank_name || "",
        bank_account_name: settings.bank_account_name || "",
        bank_sort_code: settings.bank_sort_code || "",
        bank_account_number: settings.bank_account_number || "",
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Settings</h1>
        <p className="text-muted-foreground">
          Manage your company details used across invoices and documents
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Company Information</CardTitle>
            </div>
            <CardDescription>Legal company details for invoices and contracts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="ENTS PRO LTD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registered_address">Registered Address</Label>
              <Textarea
                id="registered_address"
                value={formData.registered_address}
                onChange={(e) => setFormData({ ...formData, registered_address: e.target.value })}
                placeholder="28 Grafton Drive&#10;Southport&#10;PR8 2RN"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_number">Company Number</Label>
                <Input
                  id="company_number"
                  value={formData.company_number}
                  onChange={(e) => setFormData({ ...formData, company_number: e.target.value })}
                  placeholder="5591161"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_number">VAT Number</Label>
                <Input
                  id="vat_number"
                  value={formData.vat_number}
                  onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                  placeholder="GB278282957"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Contact Details</CardTitle>
            </div>
            <CardDescription>Email addresses for accounts and communications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accounts_email">Accounts Email</Label>
              <Input
                id="accounts_email"
                type="email"
                value={formData.accounts_email}
                onChange={(e) => setFormData({ ...formData, accounts_email: e.target.value })}
                placeholder="info@ents.pro"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Bank Details</CardTitle>
            </div>
            <CardDescription>Bank account details for invoice payments (displayed on PDF invoices)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="Monzo – Business Account"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_name">Account Name</Label>
                <Input
                  id="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                  placeholder="ENTS PRO LTD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_sort_code">Sort Code</Label>
                <Input
                  id="bank_sort_code"
                  value={formData.bank_sort_code}
                  onChange={(e) => setFormData({ ...formData, bank_sort_code: e.target.value })}
                  placeholder="04-00-03"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  placeholder="54019533"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>These details will appear on all generated invoices</span>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
