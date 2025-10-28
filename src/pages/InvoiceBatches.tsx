import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function InvoiceBatches() {
  const { data: batches, isLoading } = useQuery({
    queryKey: ["invoice_batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_batches")
        .select("*")
        .order("batch_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Invoice Batches</h1>
        <Button asChild>
          <Link to="/invoice-batches/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Invoice Batch
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoice Batches</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Date</TableHead>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches?.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      {new Date(batch.batch_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{batch.invoice_number || "-"}</TableCell>
                    <TableCell>
                      {batch.total_amount ? `£${batch.total_amount}` : "-"}
                    </TableCell>
                    <TableCell>
                      {batch.sent ? (
                        <Badge variant="success">Sent</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/invoice-batches/${batch.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
