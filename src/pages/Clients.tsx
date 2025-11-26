import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/ui/data-table"; // shadcn DataTable
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "company", header: "Company" },
  {
    id: "actions",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault(); // Stop scroll
            navigate(`/clients/${row.original.id}`); // Route to details
          }}
        >
          View Details
        </Button>
      );
    },
  },
];

export function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("clients")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (error) toast.error("Failed to load clients");
        else setClients(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading clients...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={clients} />
      </CardContent>
    </Card>
  );
}
