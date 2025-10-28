import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

export default function Parks() {
  const navigate = useNavigate();
  const [parks, setParks] = useState<any[]>([]);
  const [filteredParks, setFilteredParks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchParks();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredParks(parks);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredParks(
        parks.filter(
          (park) =>
            park.name.toLowerCase().includes(query) ||
            park.address?.toLowerCase().includes(query) ||
            park.postcode?.toLowerCase().includes(query) ||
            park.clients?.name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, parks]);

  const fetchParks = async () => {
    try {
      const { data, error } = await supabase
        .from("parks")
        .select(`
          *,
          clients:clients(name),
          venues:venues(count)
        `)
        .order("name");

      if (error) throw error;
      setParks(data || []);
      setFilteredParks(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch parks");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading parks...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parks</h1>
          <p className="text-muted-foreground">Manage holiday parks and venues</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/parks/new")}>
          <Plus className="h-4 w-4" />
          New Park
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Parks ({filteredParks.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredParks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery ? "No parks found" : "No parks yet"}
              </h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by adding your first park"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/parks/new")}>
                  <Plus className="h-4 w-4" />
                  Add Park
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParks.map((park) => (
                <div
                  key={park.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{park.name}</p>
                      {park.clients && (
                        <span className="text-sm text-muted-foreground">
                          ({park.clients.name})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {park.address || "No address"} {park.postcode && `• ${park.postcode}`}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{park.venues?.[0]?.count || 0} venues</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/parks/${park.id}`)}
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
