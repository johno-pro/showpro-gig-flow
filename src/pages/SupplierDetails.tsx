import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Edit, Trash2, Users } from "lucide-react";
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

export default function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<any>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSupplierDetails();
      fetchArtists();
      fetchContacts();
    }
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      setSupplier(data);
    } catch (error: any) {
      toast.error("Failed to fetch supplier details");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name, act_type")
        .eq("supplier_id", id)
        .order("name");

      if (error) throw error;
      setArtists(data || []);
    } catch (error: any) {
      console.error("Error:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, title, email, phone")
        .eq("supplier_id", id)
        .order("name");

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);

      if (error) throw error;
      toast.success("Supplier deleted successfully");
      navigate("/suppliers");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete supplier");
      console.error("Error:", error);
    }
  };

  if (loading) {
    return <div className="text-center">Loading supplier details...</div>;
  }

  if (!supplier) {
    return <div className="text-center">Supplier not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/suppliers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{supplier.name}</h1>
            {supplier.contact_name && (
              <p className="text-muted-foreground">Contact: {supplier.contact_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/suppliers/${id}/edit`)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {supplier.company_number && (
                <div>
                  <p className="text-sm font-medium">Company Number</p>
                  <p className="text-sm text-muted-foreground">{supplier.company_number}</p>
                </div>
              )}

              {supplier.vat_number && (
                <div>
                  <p className="text-sm font-medium">VAT Number</p>
                  <p className="text-sm text-muted-foreground">{supplier.vat_number}</p>
                </div>
              )}
            </div>

            {supplier.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Company Address</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {supplier.address}
                  </p>
                </div>
              </div>
            )}

            {supplier.notes && (
              <div>
                <p className="text-sm font-medium mb-2">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {supplier.notes}
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
              {supplier.contact_name && (
                <div>
                  <p className="text-sm font-medium">Contact Name</p>
                  <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>
                </div>
              )}

              {supplier.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a
                      href={`mailto:${supplier.email}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {supplier.email}
                    </a>
                  </div>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a
                      href={`tel:${supplier.phone}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {supplier.phone}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accounts Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.accounts_contact_name && (
                <div>
                  <p className="text-sm font-medium">Contact Name</p>
                  <p className="text-sm text-muted-foreground">{supplier.accounts_contact_name}</p>
                </div>
              )}

              {supplier.accounts_contact_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a
                      href={`mailto:${supplier.accounts_contact_email}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {supplier.accounts_contact_email}
                    </a>
                  </div>
                </div>
              )}

              {supplier.accounts_contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a
                      href={`tel:${supplier.accounts_contact_phone}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {supplier.accounts_contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {!supplier.accounts_contact_name && !supplier.accounts_contact_email && !supplier.accounts_contact_phone && (
                <p className="text-sm text-muted-foreground">No accounts contact information</p>
              )}
            </CardContent>
          </Card>
        </div>

        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Artists</span>
              <span className="text-2xl font-bold">{artists.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Contacts</span>
              <span className="text-2xl font-bold">{contacts.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Artists ({artists.length})</CardTitle>
            <Button size="sm" onClick={() => navigate("/artists/new")}>
              Add Artist
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {artists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No artists yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">{artist.name}</p>
                    {artist.act_type && (
                      <p className="text-sm text-muted-foreground">{artist.act_type}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/artists/${artist.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contacts ({contacts.length})</CardTitle>
            <Button size="sm" onClick={() => navigate("/contacts/new")}>
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No contacts yet</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.title && `${contact.title} • `}
                      {contact.email || contact.phone}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this supplier. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
