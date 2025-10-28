import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Truck, Search } from "lucide-react";
import { toast } from "sonner";

export default function Suppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSuppliers(suppliers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSuppliers(
        suppliers.filter(
          (supplier) =>
            supplier.name.toLowerCase().includes(query) ||
            supplier.contact_name?.toLowerCase().includes(query) ||
            supplier.email?.toLowerCase().includes(query) ||
            supplier.address?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, suppliers]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select(`
          *,
          artists:artists(count),
          contacts:contacts(count)
        `)
        .order("name");

      if (error) throw error;
      setSuppliers(data || []);
      setFilteredSuppliers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch suppliers");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading suppliers...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier network</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/suppliers/new")}>
          <Plus className="h-4 w-4" />
          New Supplier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Suppliers ({filteredSuppliers.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery ? "No suppliers found" : "No suppliers yet"}
              </h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by adding your first supplier"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/suppliers/new")}>
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.contact_name && (
                        <span className="text-sm text-muted-foreground">
                          Contact: {supplier.contact_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {supplier.email && <span>{supplier.email}</span>}
                      {supplier.phone && (
                        <>
                          <span>•</span>
                          <span>{supplier.phone}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{supplier.artists?.[0]?.count || 0} artists</span>
                      <span>•</span>
                      <span>{supplier.contacts?.[0]?.count || 0} contacts</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
