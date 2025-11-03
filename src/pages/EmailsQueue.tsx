import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface EmailQueueItem {
  id: string;
  booking_id: string | null;
  recipient_type: string | null;
  email_subject: string | null;
  email_body: string | null;
  approved_to_send: boolean | null;
  sent: boolean | null;
  sent_at: string | null;
  bookings?: {
    description: string;
  } | null;
}

export default function EmailsQueue() {
  const [emails, setEmails] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    recipient_type: "all",
    approved_to_send: "all",
    sent: "all"
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmails();
  }, [filters]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("emails_queue")
        .select("*, bookings!emails_queue_booking_id_fkey(description)")
        .order("created_at", { ascending: false });

      if (filters.recipient_type !== "all") {
        query = query.eq("recipient_type", filters.recipient_type);
      }
      if (filters.approved_to_send !== "all") {
        query = query.eq("approved_to_send", filters.approved_to_send === "true");
      }
      if (filters.sent !== "all") {
        query = query.eq("sent", filters.sent === "true");
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmails(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch emails: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, field: string, value: any) => {
    try {
      // Validate length constraints
      if (field === "email_subject" && value && value.length > 200) {
        toast.error("Subject must be 200 characters or less");
        return;
      }
      if (field === "email_body" && value && value.length > 10000) {
        toast.error("Body must be 10,000 characters or less");
        return;
      }

      const { error } = await supabase
        .from("emails_queue")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;
      toast.success("Updated successfully");
      fetchEmails();
    } catch (error: any) {
      toast.error("Update failed");
    }
  };

  const handleBulkApproveAndSend = async () => {
    if (selectedIds.length === 0) {
      toast.error("No emails selected");
      return;
    }

    try {
      // Filter to only approved and not sent
      const emailsToSend = emails.filter(
        e => selectedIds.includes(e.id) && e.approved_to_send && !e.sent
      );

      if (emailsToSend.length === 0) {
        toast.error("Selected emails must be approved and not yet sent");
        return;
      }

      const { error } = await supabase
        .from("emails_queue")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .in("id", emailsToSend.map(e => e.id));

      if (error) throw error;
      
      toast.success(`${emailsToSend.length} email(s) marked as sent`);
      setSelectedIds([]);
      fetchEmails();
    } catch (error: any) {
      toast.error("Bulk action failed: " + error.message);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === emails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(emails.map(e => e.id));
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Email Approvals & Sending</h1>
        
        <div className="flex gap-4 mb-4">
          <Select
            value={filters.recipient_type}
            onValueChange={(value) => setFilters({ ...filters, recipient_type: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Recipient Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.approved_to_send}
            onValueChange={(value) => setFilters({ ...filters, approved_to_send: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Approved status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Approved</SelectItem>
              <SelectItem value="false">Not Approved</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sent}
            onValueChange={(value) => setFilters({ ...filters, sent: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sent status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Sent</SelectItem>
              <SelectItem value="false">Not Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex gap-2 mb-4">
            <Button onClick={handleBulkApproveAndSend}>
              Approve & Send ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === emails.length && emails.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Body</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow key={email.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(email.id)}
                    onCheckedChange={() => toggleSelection(email.id)}
                  />
                </TableCell>
                <TableCell>
                  {email.bookings?.description || "-"}
                </TableCell>
                <TableCell>{email.recipient_type || "-"}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Input
                      value={email.email_subject || ""}
                      onBlur={(e) => handleUpdate(email.id, "email_subject", e.target.value)}
                      maxLength={200}
                      className="min-w-[200px]"
                    />
                    <div className="text-xs text-muted-foreground">
                      {(email.email_subject || "").length}/200
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Textarea
                      value={email.email_body || ""}
                      onBlur={(e) => handleUpdate(email.id, "email_body", e.target.value)}
                      maxLength={10000}
                      className="min-w-[300px] min-h-[80px]"
                    />
                    <div className="text-xs text-muted-foreground">
                      {(email.email_body || "").length}/10,000
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={email.approved_to_send || false}
                    onCheckedChange={(checked) => handleUpdate(email.id, "approved_to_send", checked)}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={email.sent || false}
                    onCheckedChange={(checked) => handleUpdate(email.id, "sent", checked)}
                  />
                </TableCell>
                <TableCell>
                  {email.sent_at ? format(new Date(email.sent_at), "PPp") : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
