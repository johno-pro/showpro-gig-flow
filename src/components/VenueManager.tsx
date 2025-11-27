import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VenueManagerProps {
  locationId?: string;
  autoCreateMainStage?: boolean;
}

export function VenueManager({ locationId, autoCreateMainStage }: VenueManagerProps) {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newVenueName, setNewVenueName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (locationId) {
      fetchVenues();
    }
  }, [locationId]);

  useEffect(() => {
    if (locationId && autoCreateMainStage && venues.length === 0) {
      createMainStage();
    }
  }, [locationId, autoCreateMainStage, venues.length]);

  const fetchVenues = async () => {
    if (!locationId) return;

    try {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("location_id", locationId)
        .order("name");

      if (error) throw error;
      setVenues(data || []);
    } catch (error: any) {
      console.error("Error fetching venues:", error);
    }
  };

  const createMainStage = async () => {
    if (!locationId) return;

    try {
      const { error } = await supabase.from("venues").insert({
        name: "Main Stage",
        location_id: locationId,
        status: "active",
      });

      if (error) throw error;
      fetchVenues();
    } catch (error: any) {
      console.error("Error creating Main Stage:", error);
    }
  };

  const handleAddVenue = async () => {
    if (!newVenueName.trim() || !locationId) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("venues").insert({
        name: newVenueName,
        location_id: locationId,
        status: "active",
      });

      if (error) throw error;
      toast.success("Performance area added");
      setNewVenueName("");
      fetchVenues();
    } catch (error: any) {
      toast.error(error.message || "Failed to add performance area");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (venue: any) => {
    setEditingId(venue.id);
    setEditName(venue.name);
  };

  const handleSaveEdit = async (venueId: string) => {
    if (!editName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("venues")
        .update({ name: editName })
        .eq("id", venueId);

      if (error) throw error;
      toast.success("Performance area updated");
      setEditingId(null);
      fetchVenues();
    } catch (error: any) {
      toast.error(error.message || "Failed to update performance area");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("venues").delete().eq("id", deleteId);

      if (error) throw error;
      toast.success("Performance area deleted");
      setDeleteId(null);
      fetchVenues();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete performance area");
    } finally {
      setLoading(false);
    }
  };

  if (!locationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Performance Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Save the location first to add performance areas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Performance Areas ({venues.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing venues */}
          <div className="space-y-2">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="flex items-center gap-2 rounded-lg border border-border p-3"
              >
                {editingId === venue.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(venue.id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSaveEdit(venue.id)}
                      disabled={loading}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{venue.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(venue)}
                      disabled={loading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(venue.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            {venues.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Building2 className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No performance areas yet
                </p>
              </div>
            )}
          </div>

          {/* Add new venue */}
          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="New performance area name..."
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddVenue();
              }}
            />
            <Button
              size="sm"
              onClick={handleAddVenue}
              disabled={!newVenueName.trim() || loading}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Performance Area?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this performance area. Bookings associated with
              this area will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
