import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  status: string | null;
  is_credit_note: boolean | null;
  subtotal: number | null;
  vat_total: number | null;
  grand_total: number | null;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    is_credit_note: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("invoices")
        .select("*")
        .order("invoice_date", { ascending: false });

      if (filters.status) {
        query = query.ilike("status", `%${filters.status}%`);
      }
      if (filters.is_credit_note !== "") {
        query = query.eq("is_credit_note", filters.is_credit_note === "true");
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch invoices: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP"
    }).format(amount);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Invoices</h1>
        
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Filter by status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-64"
          />
          
          <Select
            value={filters.is_credit_note}
            onValueChange={(value) => setFilters({ ...filters, is_credit_note: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="false">Invoice</SelectItem>
              <SelectItem value="true">Credit Note</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Credit Note</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow 
                key={invoice.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/invoices/${invoice.id}`)}
              >
                <TableCell className="font-medium">
                  {invoice.invoice_number || "-"}
                </TableCell>
                <TableCell>
                  {invoice.invoice_date ? format(new Date(invoice.invoice_date), "dd MMM yyyy") : "-"}
                </TableCell>
                <TableCell>
                  {invoice.due_date ? format(new Date(invoice.due_date), "dd MMM yyyy") : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>
                    {invoice.status || "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {invoice.is_credit_note ? (
                    <Badge variant="destructive">Credit Note</Badge>
                  ) : (
                    <Badge variant="outline">Invoice</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(invoice.grand_total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
