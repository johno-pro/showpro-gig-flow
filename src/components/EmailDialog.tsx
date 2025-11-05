import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Upload } from "lucide-react";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
}

const BOOKING_TEAM_EMAILS = [
  "booking1@agency.com",
  "booking2@agency.com",
  "booking3@agency.com",
  "booking4@agency.com",
  "booking5@agency.com",
  "booking6@agency.com",
  "booking7@agency.com",
  "booking8@agency.com",
  "booking9@agency.com",
  "booking10@agency.com",
];

export function EmailDialog({ open, onOpenChange, booking }: EmailDialogProps) {
  const [emailType, setEmailType] = useState<"artist" | "client" | "location">("artist");
  const [recipientType, setRecipientType] = useState<"accounts" | "booking_team" | "location_ents">("accounts");
  const [selectedTeamEmails, setSelectedTeamEmails] = useState<string[]>([]);
  const [customRecipient, setCustomRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showEntsForm, setShowEntsForm] = useState(false);
  const [entsName, setEntsName] = useState("");
  const [entsEmail, setEntsEmail] = useState("");
  const [entsMobile, setEntsMobile] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking && open) {
      updateEmailTemplate();
    }
  }, [booking, emailType, open]);

  const updateEmailTemplate = () => {
    const artistName = booking.artists?.name || "Artist";
    const clientName = booking.clients?.name || "Client";
    const locationName = booking.locations?.name || "Location";
    const date = new Date(booking.booking_date).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const startTime = booking.start_time || "TBC";
    const performanceTimes = booking.performance_times || "TBC";

    if (emailType === "artist") {
      setSubject(`Booking Confirmation - ${date} at ${locationName}`);
      setBody(`Hi ${artistName},

Confirming your booking for ${date} at ${locationName}.

Details:
- Client: ${clientName}
- Arrival Time: ${booking.arrival_time || startTime}
- Performance Times: ${performanceTimes}
- Fee: £${parseFloat(booking.artist_fee || 0).toFixed(2)}

${booking.notes ? `Notes: ${booking.notes}` : ""}

Please reply to confirm your availability.

Best regards,
The Agency Team`);
    } else if (emailType === "client") {
      setSubject(`Booking Update - ${artistName} on ${date}`);
      setBody(`Dear ${clientName},

This is to confirm the booking of ${artistName} for ${date} at ${locationName}.

Details:
- Performance Times: ${performanceTimes}
- Fee: £${parseFloat(booking.client_fee || 0).toFixed(2)}

${booking.notes ? `Additional Notes: ${booking.notes}` : ""}

Please contact us if you have any questions.

Best regards,
The Agency Team`);
    } else {
      setSubject(`Artist Booking - ${artistName} on ${date}`);
      setBody(`Hello,

We have confirmed a booking at ${locationName} for ${date}.

Artist: ${artistName}
Arrival Time: ${booking.arrival_time || startTime}
Performance Times: ${performanceTimes}

${booking.notes ? `Notes: ${booking.notes}` : ""}

Please ensure the venue is prepared accordingly.

Best regards,
The Agency Team`);
    }
  };

  const handleUpdateEntsContact = async () => {
    if (!booking.location_id || !entsName || !entsEmail) {
      toast.error("Please fill in all Ents contact fields");
      return;
    }

    try {
      const { data: location } = await supabase
        .from("locations")
        .select("upload_history")
        .eq("id", booking.location_id)
        .single();

      const history = Array.isArray(location?.upload_history) ? [...location.upload_history] : [];
      history.push({
        date: new Date().toISOString(),
        name: entsName,
        email: entsEmail,
        mobile: entsMobile,
      });

      const { error } = await supabase
        .from("locations")
        .update({
          ents_contact_name: entsName,
          ents_contact_email: entsEmail,
          ents_contact_mobile: entsMobile,
          upload_history: history,
        })
        .eq("id", booking.location_id);

      if (error) throw error;

      toast.success("Location contact updated");
      setShowEntsForm(false);
      setCustomRecipient(entsEmail);
    } catch (error) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact");
    }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      let recipients: string[] = [];

      if (emailType === "artist" && booking.artists?.email) {
        recipients = [booking.artists.email];
      } else if (emailType === "client") {
        if (recipientType === "accounts" && booking.clients?.accounts_contact_email) {
          recipients = [booking.clients.accounts_contact_email];
        } else if (recipientType === "booking_team") {
          recipients = selectedTeamEmails;
        } else if (customRecipient) {
          recipients = [customRecipient];
        }
      } else if (emailType === "location") {
        if (recipientType === "location_ents" && booking.locations?.ents_contact_email) {
          recipients = [booking.locations.ents_contact_email];
        } else if (customRecipient) {
          recipients = [customRecipient];
        }
      }

      if (recipients.length === 0) {
        toast.error("Please select at least one recipient");
        return;
      }

      const { error } = await supabase.from("emails_queue").insert({
        booking_id: booking.id,
        recipient_type: emailType,
        recipients: recipients,
        email_subject: subject,
        email_body: body,
        type: emailType === "artist" ? "confirmation" : "general",
        approved_to_send: false,
        sent: false,
      });

      if (error) throw error;

      toast.success("Email queued successfully. Review in Email Queue before sending.");
      onOpenChange(false);
    } catch (error) {
      console.error("Error queuing email:", error);
      toast.error("Failed to queue email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email - {booking?.artists?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Email Type</Label>
            <Select value={emailType} onValueChange={(value: any) => setEmailType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="artist">Artist Confirmation</SelectItem>
                <SelectItem value="client">Client Email</SelectItem>
                <SelectItem value="location">Location/Ents Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {emailType === "client" && (
            <div>
              <Label>Recipient Type</Label>
              <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accounts">Accounts Contact</SelectItem>
                  <SelectItem value="booking_team">Booking Team</SelectItem>
                </SelectContent>
              </Select>

              {recipientType === "booking_team" && (
                <div className="mt-3 space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <Label className="text-sm font-medium">Select Team Members</Label>
                  {BOOKING_TEAM_EMAILS.map((email) => (
                    <div key={email} className="flex items-center space-x-2">
                      <Checkbox
                        id={email}
                        checked={selectedTeamEmails.includes(email)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTeamEmails([...selectedTeamEmails, email]);
                          } else {
                            setSelectedTeamEmails(selectedTeamEmails.filter((e) => e !== email));
                          }
                        }}
                      />
                      <label htmlFor={email} className="text-sm cursor-pointer">
                        {email}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {emailType === "location" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Location Ents Contact</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEntsForm(!showEntsForm)}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {showEntsForm ? "Cancel" : "Update Contact"}
                </Button>
              </div>

              {showEntsForm ? (
                <div className="space-y-3 border rounded-lg p-4 bg-secondary/20">
                  <div>
                    <Label>Contact Name</Label>
                    <Input
                      value={entsName}
                      onChange={(e) => setEntsName(e.target.value)}
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={entsEmail}
                      onChange={(e) => setEntsEmail(e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label>Mobile</Label>
                    <Input
                      value={entsMobile}
                      onChange={(e) => setEntsMobile(e.target.value)}
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <Button onClick={handleUpdateEntsContact} size="sm">
                    Save Contact
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Current: {booking.locations?.ents_contact_email || "No contact set"}
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={loading}>
              Queue Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
