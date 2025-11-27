import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePersistentTab } from "@/hooks/usePersistentTab";
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
import { ArrowLeft, Edit, Trash2, Building2, MapPin, FileText, Plus, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { ClientForm } from "@/components/ClientForm";

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = usePersistentTab("client-details-tab", "locations");

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    try {
      // Fetch client and locations
      const [clientRes, locationsRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).maybeSingle(),
        supabase.from("locations").select("*").eq("client_id", id).order("name"),
      ]);

      if (clientRes.error) throw clientRes.error;
      if (locationsRes.error) throw locationsRes.error;

      if (!clientRes.data) {
        toast.error("Client not found");
        navigate("/clients");
        return;
      }

      setClient(clientRes.data);
      setLocations(locationsRes.data || []);
      
      // Fetch venues for the client's locations
      const locationIds = (locationsRes.data || []).map((l: any) => l.id);
      if (locationIds.length > 0) {
        const { data: venuesData } = await supabase
          .from("venues")
          .select("*")
          .in("location_id", locationIds)
          .order("name");
        setVenues(venuesData || []);
      } else {
        setVenues([]);
      }
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
                  {(locations.length > 0 || venues.length > 0) &&
                    ` and ${locations.length} location(s) and ${venues.length} venue(s) associated with them.`}
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Company Name</p>
              <p className="mt-1 text-lg font-semibold">{client.name}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {client.code && (
                <div>
                  <p className="text-sm font-medium">Client Code</p>
                  <p className="text-sm text-muted-foreground">{client.code}</p>
                </div>
              )}

              {client.company_number && (
                <div>
                  <p className="text-sm font-medium">Company Number</p>
                  <p className="text-sm text-muted-foreground">{client.company_number}</p>
                </div>
              )}

              {client.vat_number && (
                <div>
                  <p className="text-sm font-medium">VAT Number</p>
                  <p className="text-sm text-muted-foreground">{client.vat_number}</p>
                </div>
              )}
            </div>

            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Company Address</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {client.address}
                  </p>
                </div>
              </div>
            )}

            {client.notes && (
              <div>
                <p className="text-sm font-medium mb-2">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Main Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.contact_name && (
                <div>
                  <p className="text-sm font-medium">Contact Name</p>
                  <p className="text-sm text-muted-foreground">{client.contact_name}</p>
                </div>
              )}

              {client.contact_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a
                      href={`mailto:${client.contact_email}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {client.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {client.contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a
                      href={`tel:${client.contact_phone}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {client.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {!client.contact_name && !client.contact_email && !client.contact_phone && (
                <p className="text-sm text-muted-foreground">No main contact information</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accounts Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.accounts_contact_name && (
                <div>
                  <p className="text-sm font-medium">Contact Name</p>
                  <p className="text-sm text-muted-foreground">{client.accounts_contact_name}</p>
                </div>
              )}

              {client.accounts_contact_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a
                      href={`mailto:${client.accounts_contact_email}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {client.accounts_contact_email}
                    </a>
                  </div>
                </div>
              )}

              {client.accounts_contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a
                      href={`tel:${client.accounts_contact_phone}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {client.accounts_contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {!client.accounts_contact_name && !client.accounts_contact_email && !client.accounts_contact_phone && (
                <p className="text-sm text-muted-foreground">No accounts contact information</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="locations">Locations ({locations.length})</TabsTrigger>
          <TabsTrigger value="venues">Venues ({venues.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Locations
                </CardTitle>
                <Button size="sm" onClick={() => navigate(`/locations/new?client=${id}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No locations yet for this client
                </div>
              ) : (
                <div className="space-y-3">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{location.name}</p>
                        {location.address && (
                          <p className="text-sm text-muted-foreground">{location.address}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/locations/${location.id}`)}
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
                        {venue.locations && (
                          <p className="text-sm text-muted-foreground">{venue.locations.name}</p>
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
