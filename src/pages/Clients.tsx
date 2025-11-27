import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Building2, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePersistentTab } from "@/hooks/usePersistentTab";

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = usePersistentTab("clients-filter-tab", "all") as ["all" | "venues" | "clients-only", (value: string) => void];

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

  const filteredClients = clients.filter((client) => {
    if (filter === "all") return true;
    if (filter === "venues") return client.is_venue_operator === true;
    if (filter === "clients-only") return client.is_venue_operator === false;
    return true;
  });

  if (loading) return <div className="text-center py-8">Loading clients...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client database</p>
        </div>
        <Button onClick={() => navigate("/clients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>All Clients</CardTitle>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                All ({clients.length})
              </TabsTrigger>
              <TabsTrigger value="venues" className="gap-2">
                <Building2 className="h-4 w-4" />
                Venue Operators ({clients.filter(c => c.is_venue_operator === true).length})
              </TabsTrigger>
              <TabsTrigger value="clients-only" className="gap-2">
                <Users className="h-4 w-4" />
                Clients Only ({clients.filter(c => c.is_venue_operator === false).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Contact Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    {client.is_venue_operator === false ? (
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        Client Only
                      </Badge>
                    ) : (
                      <Badge variant="default" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        Venue Operator
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{client.contact_email || "—"}</TableCell>
                  <TableCell>{client.contact_name || "—"}</TableCell>
                  <TableCell>{client.status || "active"}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}