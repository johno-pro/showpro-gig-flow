import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          bookings(
            job_code,
            booking_date,
            artists(name),
            clients(name)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredInvoices = invoices?.filter((invoice) => {
    const booking = invoice.bookings as any;
    const matchesSearch =
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking?.job_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking?.artists?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking?.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "sent":
        return "default";
      case "paid":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading invoices...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">View and manage individual invoices</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Invoices ({filteredInvoices?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, job code, artist, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredInvoices && filteredInvoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Job Code</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const booking = invoice.bookings as any;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-medium">
                        <Link to={`/invoices/${invoice.id}`} className="text-primary hover:underline">
                          {invoice.invoice_number || "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono">
                        {booking?.job_code || "—"}
                        {booking?.job_code || "—"}
                      </TableCell>
                      <TableCell>{booking?.artists?.name || "—"}</TableCell>
                      <TableCell>{booking?.clients?.name || "—"}</TableCell>
                      <TableCell>
                        {booking?.booking_date
                          ? new Date(booking.booking_date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        £{parseFloat(String(invoice.amount_due)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status || "draft")}>
                          {invoice.status?.toUpperCase() || "DRAFT"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.due_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "No invoices found matching your criteria"
                : "No invoices yet"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
