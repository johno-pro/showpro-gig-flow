import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search } from "lucide-react";
import { toast } from "sonner";

export default function Artists() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<any[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchArtists();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredArtists(artists);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredArtists(
        artists.filter(
          (artist) =>
            artist.name.toLowerCase().includes(query) ||
            artist.full_name?.toLowerCase().includes(query) ||
            artist.act_type?.toLowerCase().includes(query) ||
            artist.email?.toLowerCase().includes(query) ||
            artist.suppliers?.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, artists]);

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select(`
          *,
          suppliers (
            name,
            contact_name,
            email,
            phone
          )
        `)
        .order("name");

      if (error) throw error;
      setArtists(data || []);
      setFilteredArtists(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch artists");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading artists...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Artists</h1>
          <p className="text-muted-foreground">Manage your entertainment artists and acts</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/artists/new")}>
          <Plus className="h-4 w-4" />
          New Artist
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Artists ({filteredArtists.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredArtists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery ? "No artists found" : "No artists yet"}
              </h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by adding your first artist"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/artists/new")}>
                  <Plus className="h-4 w-4" />
                  Add Artist
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArtists.map((artist) => {
                const displayEmail = artist.suppliers?.email || artist.email;
                const displayPhone = artist.suppliers?.phone || artist.phone;
                const supplierName = artist.suppliers?.name;

                return (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-medium">{artist.name}</p>
                        {artist.full_name && (
                          <span className="text-sm text-muted-foreground">({artist.full_name})</span>
                        )}
                        {supplierName && (
                          <Badge variant="secondary">{supplierName}</Badge>
                        )}
                        {artist.act_type && (
                          <Badge variant="outline">{artist.act_type}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {displayEmail && <span>{displayEmail}</span>}
                        {displayPhone && <span>{displayPhone}</span>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/artists/${artist.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
