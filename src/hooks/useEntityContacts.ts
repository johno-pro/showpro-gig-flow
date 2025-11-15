import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
}

export function useEntityContacts(
  entityType: "client" | "artist" | "supplier" | "location" | "venue",
  entityId?: string
) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const tableName = `contact_${entityType}s`;
  const entityIdField = `${entityType}_id`;

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (entityId) {
      fetchEntityContacts();
    }
  }, [entityId]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, title, email, phone")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    }
  };

  const fetchEntityContacts = async () => {
    if (!entityId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          contact_id,
          role,
          is_primary,
          contacts!inner(id, name, title, email, phone)
        `)
        .eq(entityIdField, entityId);

      if (error) throw error;

      const contactIds = (data || []).map((item: any) => item.contact_id);
      setSelectedContactIds(contactIds);
    } catch (error) {
      console.error("Error fetching entity contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveEntityContacts = async (entityId: string, contactIds: string[]) => {
    try {
      // Remove old relationships
      const { error: deleteError } = await supabase
        .from(tableName as any)
        .delete()
        .eq(entityIdField, entityId);

      if (deleteError) throw deleteError;

      // Add new relationships
      if (contactIds.length > 0) {
        const relationships = contactIds.map((contactId, index) => ({
          [entityIdField]: entityId,
          contact_id: contactId,
          is_primary: index === 0, // First contact is primary
        }));

        const { error: insertError } = await supabase
          .from(tableName as any)
          .insert(relationships);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error("Error saving entity contacts:", error);
      throw error;
    }
  };

  return {
    contacts,
    selectedContactIds,
    setSelectedContactIds,
    saveEntityContacts,
    loading,
  };
}
