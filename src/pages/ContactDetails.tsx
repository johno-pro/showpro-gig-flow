import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, User, Building2, MapPin, Briefcase, Edit, Trash2 } from "lucide-react";
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

export default function ContactDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContactDetails();
    }
  }, [id]);

  const fetchContactDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          clients:clients(id, name),
          locations:locations(id, name),
          departments:departments(id, name),
          suppliers:suppliers(id, name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      setContact(data);
    } catch (error: any) {
      toast.error("Failed to fetch contact details");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id);

      if (error) throw error;
      toast.success("Contact deleted successfully");
      navigate("/contacts");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete contact");
      console.error("Error:", error);
    }
  };

  if (loading) {
    return <div className="text-center">Loading contact details...</div>;
  }

  if (!contact) {
    return <div className="text-center">Contact not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/contacts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{contact.name}</h1>
            {contact.title && (
              <p className="text-muted-foreground">{contact.title}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/contacts/${id}/edit`)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            )}

            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            )}

            {contact.mobile && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Mobile</p>
                  <a
                    href={`tel:${contact.mobile}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {contact.mobile}
                  </a>
                </div>
              </div>
            )}

            {contact.notes && (
              <div>
                <p className="text-sm font-medium mb-2">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {contact.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Affiliations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact.clients && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Client</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm text-muted-foreground"
                    onClick={() => navigate(`/clients/${contact.clients.id}`)}
                  >
                    {contact.clients.name}
                  </Button>
                </div>
              </div>
            )}

            {contact.locations && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm text-muted-foreground"
                    onClick={() => navigate(`/locations/${contact.locations.id}`)}
                  >
                    {contact.locations.name}
                  </Button>
                </div>
              </div>
            )}

            {contact.departments && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Department</p>
                  <p className="text-sm text-muted-foreground">
                    {contact.departments.name}
                  </p>
                </div>
              </div>
            )}

            {contact.suppliers && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Supplier</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm text-muted-foreground"
                    onClick={() => navigate(`/suppliers/${contact.suppliers.id}`)}
                  >
                    {contact.suppliers.name}
                  </Button>
                </div>
              </div>
            )}

            {!contact.clients && !contact.locations && !contact.departments && !contact.suppliers && (
              <p className="text-sm text-muted-foreground">No affiliations</p>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this contact. This action cannot be undone.
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
