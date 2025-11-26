import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Building, Search } from "lucide-react";
import { toast } from "sonner";

export default function Venues() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<any[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVenues(venues);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredVenues(
        venues.filter(
          (venue) =>
            venue.name.toLowerCase().includes(query) ||
            venue.locationName?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, venues]);

  const fetchVenues = async () => {
    try {
      const { data: venuesData, error: venuesError } = await supabase
        .from("venues")
        .select("*")
        .order("name");

      if (venuesError) throw venuesError;

      // Fetch locations with client info to filter by venue operators
      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("id, name, client_id, clients:client_id(is_venue_operator)");

      if (locationsError) throw locationsError;

      // Create a map for quick lookup (only venue operator locations)
      const venueOperatorLocationIds = new Set(
        (locationsData || [])
          .filter((loc) => loc.clients?.is_venue_operator !== false)
          .map((loc) => loc.id)
      );
      const locationsMap = new Map(locationsData?.map(loc => [loc.id, loc.name]) || []);

      // Filter venues to only those at venue operator locations
      const venuesWithLocations = (venuesData || [])
        .filter((venue) => !venue.location_id || venueOperatorLocationIds.has(venue.location_id))
        .map((venue) => ({
          ...venue,
          locationName: venue.location_id ? locationsMap.get(venue.location_id) : null
        }));

      setVenues(venuesWithLocations);
      setFilteredVenues(venuesWithLocations);
    } catch (error: any) {
      toast.error("Failed to fetch venues");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading venues...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Venues</h1>
          <p className="text-muted-foreground">Manage entertainment venues</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/venues/new")}>
          <Plus className="h-4 w-4" />
          New Venue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Venues ({filteredVenues.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVenues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery ? "No venues found" : "No venues yet"}
              </h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by adding your first venue"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/venues/new")}>
                  <Plus className="h-4 w-4" />
                  Add Venue
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVenues.map((venue) => (
                <div
                  key={venue.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{venue.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {venue.locationName && <span>{venue.locationName}</span>}
                      {venue.capacity && <span>Capacity: {venue.capacity}</span>}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/venues/${venue.id}`)}
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
