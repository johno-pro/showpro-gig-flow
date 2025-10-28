import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, Building2, MapPin, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { ClientForm } from "@/components/ClientForm";

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [parks, setParks] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    try {
      const [clientRes, locationsRes, venuesRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).maybeSingle(),
        supabase.from("locations").select("*").eq("client_id", id).order("name"),
        supabase
          .from("venues")
          .select(`
            *,
            locations (name)
          `)
          .eq("location_id", id)
          .order("name"),
      ]);

      if (clientRes.error) throw clientRes.error;
      if (locationsRes.error) throw locationsRes.error;
      if (venuesRes.error) throw venuesRes.error;

      if (!clientRes.data) {
        toast.error("Client not found");
        navigate("/clients");
        return;
      }

      setClient(clientRes.data);
      setParks(locationsRes.data || []);
      setVenues(venuesRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch client details");
      console.error(error);
      navigate("/clients");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);

      if (error) throw error;

      toast.success("Client deleted successfully");
      navigate("/clients");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete client");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading client details...</div>;
  }

  if (!client) {
    return <div className="text-center">Client not found</div>;
  }

  if (editMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setEditMode(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Client</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <ClientForm
              clientId={id}
              onSuccess={() => {
                setEditMode(false);
                fetchClientData();
              }}
              onCancel={() => setEditMode(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Client Details</h1>
            <p className="text-muted-foreground">View and manage client information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditMode(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the client
                  {(parks.length > 0 || venues.length > 0) &&
                    ` and ${parks.length} park(s) and ${venues.length} venue(s) associated with them.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="mt-1 text-lg font-semibold">{client.name}</p>
          </div>

          {client.code && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Code</p>
                <p className="mt-1">{client.code}</p>
              </div>
            </>
          )}

          {client.address && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="mt-1 whitespace-pre-wrap">{client.address}</p>
              </div>
            </>
          )}

          {client.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{client.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="parks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parks">Parks ({parks.length})</TabsTrigger>
          <TabsTrigger value="venues">Venues ({venues.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="parks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Parks
                </CardTitle>
                <Button size="sm" onClick={() => navigate(`/parks/new?client=${id}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Park
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {parks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No parks yet for this client
                </div>
              ) : (
                <div className="space-y-3">
                  {parks.map((park) => (
                    <div
                      key={park.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{park.name}</p>
                        {park.address && (
                          <p className="text-sm text-muted-foreground">{park.address}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/parks/${park.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="venues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Venues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {venues.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No venues yet for this client
                </div>
              ) : (
                <div className="space-y-3">
                  {venues.map((venue) => (
                    <div
                      key={venue.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{venue.name}</p>
                        {venue.parks && (
                          <p className="text-sm text-muted-foreground">{venue.parks.name}</p>
                        )}
                        {venue.capacity && (
                          <p className="text-sm text-muted-foreground">
                            Capacity: {venue.capacity}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/venues/${venue.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
