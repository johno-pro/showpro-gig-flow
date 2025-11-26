import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

export default function Locations() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLocations(locations);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredLocations(
        locations.filter(
          (location) =>
            location.name.toLowerCase().includes(query) ||
            location.address?.toLowerCase().includes(query) ||
            location.postcode?.toLowerCase().includes(query) ||
            location.clients?.name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, locations]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select(`
          *,
          clients:client_id(name, is_venue_operator)
        `)
        .order("name");

      if (error) throw error;
      
      // Filter to only show locations linked to venue operators
      const venueOperatorLocations = (data || []).filter(
        (location) => location.clients?.is_venue_operator !== false
      );

      // Count venues for each location
      const locationsWithVenueCount = await Promise.all(
        venueOperatorLocations.map(async (location) => {
          const { count } = await supabase
            .from("venues")
            .select("*", { count: "exact", head: true })
            .eq("location_id", location.id);
          return { ...location, venueCount: count || 0 };
        })
      );
      
      setLocations(locationsWithVenueCount);
      setFilteredLocations(locationsWithVenueCount);
    } catch (error: any) {
      toast.error("Failed to fetch locations");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading locations...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground">Manage holiday locations and venues</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/locations/new")}>
          <Plus className="h-4 w-4" />
          New Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Locations ({filteredLocations.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery ? "No locations found" : "No locations yet"}
              </h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by adding your first location"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/locations/new")}>
                  <Plus className="h-4 w-4" />
                  Add Location
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{location.name}</p>
                      {location.clients && (
                        <span className="text-sm text-muted-foreground">
                          ({location.clients.name})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {location.address || "No address"} {location.postcode && `• ${location.postcode}`}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{location.venueCount || 0} venues</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/locations/${location.id}`)}
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
